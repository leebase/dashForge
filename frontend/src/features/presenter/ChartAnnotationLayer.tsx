import {
  isBarWidget,
  isLineWidget,
  isStackedBarWidget,
  type AnnotationSpec,
  type WidgetSpec,
} from "../../core/spec/dashboardSpec";

export function getSupportedAnnotationTypes(widget: WidgetSpec): AnnotationSpec["type"][] {
  if (isLineWidget(widget) || isBarWidget(widget) || isStackedBarWidget(widget)) {
    return ["reference_line", "text_label"];
  }

  return ["text_label"];
}

export function getRenderableAnnotations(widget: WidgetSpec) {
  const supportedTypes = new Set(getSupportedAnnotationTypes(widget));

  return (widget.annotations ?? []).filter((annotation) =>
    supportedTypes.has(annotation.type),
  );
}

interface ChartAnnotationLayerProps {
  annotations?: AnnotationSpec[];
  widget: WidgetSpec;
}

export function ChartAnnotationLayer({
  annotations,
  widget,
}: ChartAnnotationLayerProps) {
  const renderableAnnotations =
    annotations?.filter((annotation) =>
      getSupportedAnnotationTypes(widget).includes(annotation.type),
    ) ?? getRenderableAnnotations(widget);

  if (renderableAnnotations.length === 0) {
    return null;
  }

  return (
    <div className="annotation-layer" aria-label={`${widget.title} annotations`}>
      {renderableAnnotations.map((annotation, index) => (
        <div
          className="annotation-layer__item"
          key={`${annotation.type}-${annotation.label}-${index}`}
          style={{
            borderColor: annotation.color ?? "var(--df-accent)",
          }}
        >
          <p className="annotation-layer__eyebrow">
            {annotation.type === "reference_line" ? "Reference line" : "Callout"}
          </p>
          <p className="annotation-layer__label">{annotation.label}</p>
          {annotation.type === "reference_line" && typeof annotation.value === "number" ? (
            <p className="annotation-layer__value">Value {annotation.value}</p>
          ) : null}
        </div>
      ))}
    </div>
  );
}
