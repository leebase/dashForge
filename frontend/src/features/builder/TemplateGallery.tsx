import type { TemplateCatalogEntry } from "../../mock-data/templateCatalog";

interface TemplateGalleryProps {
  currentPackId: string;
  selectedTemplateId?: string;
  templates: TemplateCatalogEntry[];
  onApplyTemplate: (templateId: string) => void;
}

export function TemplateGallery({
  currentPackId,
  selectedTemplateId,
  templates,
  onApplyTemplate,
}: TemplateGalleryProps) {
  return (
    <section className="builder-panel builder-panel--wide" aria-labelledby="template-gallery-title">
      <div className="builder-panel__header">
        <p className="eyebrow">Templates</p>
        <h2 className="builder-panel__title" id="template-gallery-title">
          Starter Dashboards
        </h2>
      </div>

      <div className="template-gallery">
        {templates.map((template) => {
          const isSelected = template.templateId === selectedTemplateId;

          return (
            <article
              className={
                isSelected
                  ? "template-card template-card--selected"
                  : "template-card"
              }
              key={template.templateId}
            >
              <div>
                <p className="template-card__meta">
                  {template.packId === currentPackId ? "Current Pack" : template.packId}
                </p>
                <h3>{template.title}</h3>
                <p>{template.description}</p>
              </div>
              <div className="template-card__footer">
                <span>
                  {template.intent.replaceAll("_", " ")} · {template.audience}
                </span>
                <button
                  className="button button--secondary"
                  onClick={() => onApplyTemplate(template.templateId)}
                  type="button"
                >
                  Apply Template
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
