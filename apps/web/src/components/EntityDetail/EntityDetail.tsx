import { useState, useEffect } from 'react';
import { EntityDetailResponse, ConnectionItem } from '../../types';
import { fetchEntity } from '../../api';
import './EntityDetail.scss';

interface EntityDetailProps {
  entityId: string;
  onBack: () => void;
  onEntityClick: (entityId: string) => void;
}

function formatTag(tag: string) {
  return tag.replace(/_/g, ' ');
}

interface ConnectionBlockProps {
  title: string;
  items: ConnectionItem[];
  onEntityClick: (id: string) => void;
}

function ConnectionBlock({ title, items, onEntityClick }: ConnectionBlockProps) {
  if (items.length === 0) return null;

  return (
    <div className="ConnectionBlock">
      <h3 className="ConnectionBlock__title">{title}</h3>
      <ul className="ConnectionBlock__list">
        {items.map((item) => (
          <li key={item.id} className="ConnectionBlock__item">
            <button
              className="ConnectionBlock__link"
              onClick={() => onEntityClick(item.id)}
            >
              {item.name}
            </button>
            {item.role && (
              <span className="ConnectionBlock__role">{item.role}</span>
            )}
            {item.context && (
              <span className="ConnectionBlock__context">{item.context}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function EntityDetail({ entityId, onBack, onEntityClick }: EntityDetailProps) {
  const [data, setData] = useState<EntityDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    fetchEntity(entityId)
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [entityId]);

  if (loading) {
    return <div className="EntityDetail EntityDetail--loading">Loading...</div>;
  }

  if (error) {
    return (
      <div className="EntityDetail EntityDetail--error">
        <p>{error}</p>
        <button onClick={onBack} className="EntityDetail__backBtn">
          Back to search
        </button>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const { entity, connections } = data;

  const metaParts: string[] = [];
  if (entity.location) metaParts.push(entity.location);
  if (entity.country) metaParts.push(entity.country);
  if (entity.stage) metaParts.push(entity.stage);
  if (entity.role_title) metaParts.push(entity.role_title);
  if (entity.company_name) metaParts.push(`@ ${entity.company_name}`);
  if (entity.event_type) metaParts.push(entity.event_type);

  const meta = metaParts.join(' • ');

  const showTeam = connections.team.length > 0;
  const showInvestors = connections.investors.length > 0 && entity.entity_type === 'startup';
  const showPortfolio = connections.portfolio.length > 0 && entity.entity_type === 'investor';
  const showEvents = connections.events.length > 0;
  const showSpeakers = connections.speakers.length > 0 && entity.entity_type === 'event';
  const showRelated = connections.related.length > 0;

  const hasConnections = showTeam || showInvestors || showPortfolio || showEvents || showSpeakers || showRelated;

  return (
    <div className="EntityDetail">
      <button onClick={onBack} className="EntityDetail__backBtn">
        &larr; Back to search
      </button>

      <header className="EntityDetail__header">
        <div className="EntityDetail__titleRow">
          <h1 className="EntityDetail__name">{entity.name}</h1>
          <span className="EntityDetail__type">{entity.entity_type}</span>
        </div>
        {meta && <p className="EntityDetail__meta">{meta}</p>}
      </header>

      {entity.description && (
        <section className="EntityDetail__description">
          <p>{entity.description}</p>
        </section>
      )}

      {entity.industries.length > 0 && (
        <div className="EntityDetail__tags">
          {entity.industries.map((ind) => (
            <span key={ind} className="EntityDetail__tag">
              {formatTag(ind)}
            </span>
          ))}
        </div>
      )}

      {entity.topics.length > 0 && (
        <div className="EntityDetail__topics">
          <span className="EntityDetail__topicsLabel">Topics:</span>{' '}
          {entity.topics.map(formatTag).join(', ')}
        </div>
      )}

      {entity.speakers && entity.speakers.length > 0 && (
        <div className="EntityDetail__speakersList">
          <span className="EntityDetail__speakersLabel">Speakers:</span>{' '}
          {entity.speakers.join(', ')}
        </div>
      )}

      {hasConnections && (
        <section className="EntityDetail__connections">
          <h2 className="EntityDetail__connectionsTitle">Connections</h2>

          <div className="EntityDetail__connectionsGrid">
            {showTeam && (
              <ConnectionBlock
                title="Team"
                items={connections.team}
                onEntityClick={onEntityClick}
              />
            )}

            {showInvestors && (
              <ConnectionBlock
                title="Investors"
                items={connections.investors}
                onEntityClick={onEntityClick}
              />
            )}

            {showPortfolio && (
              <ConnectionBlock
                title="Portfolio"
                items={connections.portfolio}
                onEntityClick={onEntityClick}
              />
            )}

            {showEvents && (
              <ConnectionBlock
                title="Events"
                items={connections.events}
                onEntityClick={onEntityClick}
              />
            )}

            {showSpeakers && (
              <ConnectionBlock
                title="Speakers"
                items={connections.speakers}
                onEntityClick={onEntityClick}
              />
            )}

            {showRelated && (
              <ConnectionBlock
                title="Related"
                items={connections.related}
                onEntityClick={onEntityClick}
              />
            )}
          </div>
        </section>
      )}
    </div>
  );
}
