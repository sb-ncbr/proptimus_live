import { Level } from "./enums";

type LoggerConfigInternal = {
  minimalLevel: Level;
  format: string;
  printStackTrace: boolean;
  printFunctionName: boolean;
  appFilter: string[];
};

export type LoggerConfig = Partial<LoggerConfigInternal>;

const defaultConfig: LoggerConfigInternal = {
  minimalLevel: Level.WARNING, // default in PRODUCTION
  format: "",
  printStackTrace: false,
  printFunctionName: false,
  appFilter: [],
};

class Logger {
  private static instance: Logger;
  private config: LoggerConfigInternal;

  private constructor(config: LoggerConfigInternal) {
    this.config = config;
  }

  public static getLogger(): Logger {
    if (!Logger.instance) {
      Logger.setup();
    }

    return Logger.instance;
  }

  public static setup(config: LoggerConfig = {}) {
    if (Logger.instance) {
      return;
    }

    const configInternal: LoggerConfigInternal = {
      ...defaultConfig,
      ...config,
    };

    if (
      config.minimalLevel === undefined &&
      process.env.NODE_ENV !== undefined &&
      process.env.NODE_ENV === "development"
    ) {
      configInternal.minimalLevel = Level.DEBUG;
    } else {
      configInternal.appFilter = [];
    }

    Logger.instance = new Logger(configInternal);
  }

  private getStackTrace(): [string, string] {
    let stack = "";

    try {
      throw new Error();
    } catch (error) {
      stack = (error as Error).stack || "";
    }

    if (stack === "") {
      return ["", ""];
    }

    const split = stack.split("\n").map((line: string) => line.trim());

    const fnName = split[3]?.split("@")[0];
    const lineChar = split[3]?.split(":");
    const lineNumStr = `${fnName}:${lineChar?.[3] || ""}:${lineChar?.[4] || ""}`;

    return [split.splice(3).join("\n"), lineNumStr];
  }

  protected levelToString(level: Level): string {
    switch (level) {
      case Level.DEBUG:
        return "DEBUG";
      case Level.INFO:
        return "INFO";
      case Level.WARNING:
        return "WARNING";
      case Level.ERROR:
        return "ERROR";
      default:
        return "UNKNOWN";
    }
  }

  public log(
    level: Level,
    message: string,
    app: string,
    printStackTrace: boolean
  ) {
    if (level < this.config.minimalLevel) {
      return;
    }

    if (
      this.config.appFilter.length > 0 &&
      !this.config.appFilter.includes(app)
    ) {
      return;
    }

    const currentDateTime = new Date().toISOString();
    const st = this.getStackTrace();

    let _msg = "";
    if (this.config.printFunctionName) {
      _msg = `[${currentDateTime}, ${app}, ${st[1]}] ${this.levelToString(level)}: ${message}`;
    } else {
      _msg = `[${currentDateTime}, ${app}] ${this.levelToString(level)}: ${message}`;
    }

    if (printStackTrace) {
      _msg += `\n${st[0]}`;
    }
  }
}

export function setup(config: LoggerConfig) {
  Logger.setup(config);
}

export function debug(message: string, app: string, printStackTrace = false) {
  Logger.getLogger().log(Level.DEBUG, message, app, printStackTrace);
}

export function info(message: string, app: string, printStackTrace = false) {
  Logger.getLogger().log(Level.INFO, message, app, printStackTrace);
}

export function warning(message: string, app: string, printStackTrace = false) {
  Logger.getLogger().log(Level.WARNING, message, app, printStackTrace);
}

export function error(message: string, app: string, printStackTrace = true) {
  Logger.getLogger().log(Level.ERROR, message, app, printStackTrace);
}
