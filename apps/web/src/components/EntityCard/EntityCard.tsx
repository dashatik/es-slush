import { SearchDocument } from '../../types';
import './EntityCard.scss';

interface EntityCardProps {
  entity: SearchDocument;
}

function formatTag(tag: string) {
  return tag.replace(/_/g, ' ');
}

export function EntityCard({ entity }: EntityCardProps) {
  const metaParts: string[] = [];
  if (entity.location) metaParts.push(entity.location);
  if (entity.country) metaParts.push(entity.country);
  if (entity.stage) metaParts.push(entity.stage);
  if (entity.role_title) metaParts.push(entity.role_title);
  if (entity.company_name) metaParts.push(`@ ${entity.company_name}`);
  if (entity.event_type) metaParts.push(entity.event_type);

  const meta = metaParts.join(' • ');

  return (
    <article className="EntityCard">
      <header className="EntityCard__header">
        <div className="EntityCard__titleWrap">
          <h3 className="EntityCard__name" title={entity.name}>
            {entity.name}
          </h3>

          {meta && <div className="EntityCard__meta">{meta}</div>}
        </div>

        <span className="EntityCard__type">{entity.entity_type}</span>
      </header>

      {entity.description && (
        <p className="EntityCard__description">{entity.description}</p>
      )}

      {entity.industries.length > 0 && (
        <div className="EntityCard__tags" aria-label="Industries">
          {entity.industries.map((ind) => (
            <span key={ind} className="EntityCard__tag">
              {formatTag(ind)}
            </span>
          ))}
        </div>
      )}

      {entity.speakers && entity.speakers.length > 0 && (
        <div className="EntityCard__speakers">
          <span className="EntityCard__speakersLabel">Speakers:</span>{' '}
          {entity.speakers.join(', ')}
        </div>
      )}
    </article>
  );
}
