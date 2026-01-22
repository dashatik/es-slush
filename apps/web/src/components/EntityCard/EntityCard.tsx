import { ChunkSearchResult } from '../../types';
import './EntityCard.scss';

interface EntityCardProps {
  entity: ChunkSearchResult;
  onClick?: (entityId: string) => void;
}

function formatTag(tag: string) {
  return tag.replace(/_/g, ' ');
}

/* EntityCard - Displays a search result entity with optional highlight snippet
v2: Shows highlight from content field when available, falls back to title
Highlight contains HTML (<mark> tags) rendered via dangerouslySetInnerHTML
Click handler navigates to entity detail page */

export function EntityCard({ entity, onClick }: EntityCardProps) {
  const metaParts: string[] = [];
  if (entity.country) metaParts.push(entity.country);
  if (entity.stage) metaParts.push(entity.stage);
  if (entity.event_type) metaParts.push(entity.event_type);

  const meta = metaParts.join(' • ');

  const highlightHtml = entity.highlight?.content?.[0];
  const snippetText = entity.title;

  const handleClick = () => {
    if (onClick) {
      onClick(entity.entity_id);
    }
  };

  return (
    <article
      className={`EntityCard ${onClick ? 'EntityCard--clickable' : ''}`}
      onClick={handleClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      <header className="EntityCard__header">
        <div className="EntityCard__titleWrap">
          <h3 className="EntityCard__name" title={entity.name}>
            {entity.name}
          </h3>

          {meta && <div className="EntityCard__meta">{meta}</div>}
        </div>

        <span className="EntityCard__type">{entity.entity_type}</span>
      </header>

      {highlightHtml ? (
        <p
          className="EntityCard__description EntityCard__description--highlight"
          dangerouslySetInnerHTML={{ __html: highlightHtml }}
        />
      ) : (
        snippetText && (
          <p className="EntityCard__description">{snippetText}</p>
        )
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
    </article>
  );
}
