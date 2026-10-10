import { createQuery } from '../utils/api/hooks';

export type JSONValue = string | number | boolean | null | Date | JSONObject | JSONArray;
export interface JSONObject {
  [key: string]: JSONValue;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface JSONArray extends Array<string | number | boolean | Date | JSONObject | JSONValue> {}

export type Config = {
  version: string;
  environment: string;
  editor: {
    url: string;
    version: string;
  };
  enableDeveloperExperiments: boolean;
  database: string;
  blogUrl?: string;
  labs: Record<string, boolean>;
  mail: string;
  klipy?: {
    apiKey?: string | null;
    contentFilter?: string;
  };
  security?: {
    staffDeviceVerification?: boolean;
    // directory serving the Koenig embed renderer on a separate origin
    embedPreviewUrl?: string;
  };
  // Config is relatively fluid, so we only type used properties above and still support arbitrary property access when needed
  [key: string]: JSONValue | undefined;
};

export interface ConfigResponseType {
  config: Config;
}

const dataType = 'ConfigResponseType';

export const configDataType = dataType;

export const useBrowseConfig = createQuery<ConfigResponseType>({
  dataType,
  path: '/config/',
});
