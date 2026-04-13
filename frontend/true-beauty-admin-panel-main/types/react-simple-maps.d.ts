declare module "react-simple-maps" {
  import { FC, ReactNode } from "react";

  export interface ComposableMapProps {
    width?: number;
    height?: number;
    projection?: string;
    projectionConfig?: { scale?: number; center?: [number, number]; [key: string]: unknown };
    className?: string;
    style?: React.CSSProperties;
    children?: ReactNode;
  }

  export const ComposableMap: FC<ComposableMapProps>;

  export interface GeographiesProps {
    geography: string | object;
    children: (props: {
      geographies: Array<{ rsmKey: string; properties?: Record<string, unknown>; geometry?: unknown; [key: string]: unknown }>;
      path?: (geo: unknown) => string;
      projection?: (coords: [number, number]) => [number, number];
    }) => ReactNode;
  }

  export const Geographies: FC<GeographiesProps>;

  export interface GeographyProps {
    geography: { rsmKey: string; properties?: Record<string, unknown>; [key: string]: unknown };
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
    style?: { default?: object; hover?: object; pressed?: object };
  }

  export const Geography: FC<GeographyProps>;

  export interface ZoomableGroupProps {
    center?: [number, number];
    zoom?: number;
    minZoom?: number;
    maxZoom?: number;
    children?: ReactNode;
  }

  export const ZoomableGroup: FC<ZoomableGroupProps>;

  export interface MarkerProps {
    coordinates: [number, number];
    children?: ReactNode;
    onMouseEnter?: (evt: React.MouseEvent) => void;
    onMouseLeave?: (evt: React.MouseEvent) => void;
    style?: { default?: object; hover?: object; pressed?: object };
    className?: string;
  }

  export const Marker: FC<MarkerProps>;
}
