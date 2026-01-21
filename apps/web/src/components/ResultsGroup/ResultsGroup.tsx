import { ChunkSearchResult } from '../../types';
import { EntityCard } from '../EntityCard/EntityCard';
import './ResultsGroup.scss';

interface ResultsGroupProps {
  title: string;
  entities: ChunkSearchResult[];
  count: number;
}

export function ResultsGroup({ title, entities, count }: ResultsGroupProps) {
  if (count === 0) return null;

  return (
    <section className="ResultsGroup" aria-label={`${title} results`}>
      <header className="ResultsGroup__header">
        <h2 className="ResultsGroup__title">{title}</h2>
        <span className="ResultsGroup__count" aria-label={`${count} results`}>
          {count}
        </span>
      </header>

      <div className="ResultsGroup__grid">
        {entities.map((entity) => (
          <EntityCard key={entity.entity_id} entity={entity} />
        ))}
      </div>
    </section>
  );
}