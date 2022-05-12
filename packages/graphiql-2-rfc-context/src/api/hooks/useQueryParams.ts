import { useBrowserContext } from '../providers/GraphiQLBrowserProvider';

export default function useQueryParams(name: string) {
  const { queryStringParams } = useBrowserContext();
  return queryStringParams[name];
}
