export type LogLevel =
  | "debug"
  | "info"
  | "notice"
  | "warning"
  | "error"
  | "critical"
  | "alert"
  | "success"
  | "emergency";

export interface ChannelConfig {
  driver: string;
  path?: string;
  level: LogLevel;
  days?: number;
}

export interface LogConfig {
  default: string;
  channels: {
    [key: string]: ChannelConfig;
  };
}
