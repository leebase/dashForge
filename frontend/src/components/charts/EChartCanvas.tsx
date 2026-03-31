import { useEffect, useRef } from "react";
import { LineChart } from "echarts/charts";
import { GridComponent, TooltipComponent } from "echarts/components";
import { init, use, type EChartsCoreOption } from "echarts/core";
import { SVGRenderer } from "echarts/renderers";

use([LineChart, GridComponent, TooltipComponent, SVGRenderer]);

interface EChartCanvasProps {
  option: EChartsCoreOption;
  title: string;
}

export function EChartCanvas({ option, title }: EChartCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = containerRef.current;
    const isJsdom =
      typeof navigator !== "undefined" && /jsdom/i.test(navigator.userAgent);

    if (!node || isJsdom) {
      return;
    }

    const chart = init(node, undefined, { renderer: "svg" });
    chart.setOption(option);

    const handleResize = () => chart.resize();
    window.addEventListener("resize", handleResize);

    let resizeObserver: ResizeObserver | undefined;

    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => chart.resize());
      resizeObserver.observe(node);
    }

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener("resize", handleResize);
      chart.dispose();
    };
  }, [option]);

  return <div aria-label={title} className="chart-shell" ref={containerRef} role="img" />;
}
