import { omit } from "lodash";
import { useEffect, useState } from "react";
import { getApiRouteForCurrentDB } from "../../../utils/arangoClient";

import useSWR from "swr";
import { encodeHelper } from "../../../utils/encodeHelper";
import { ViewPropertiesType } from "../View.types";

export function useFetchViewProperties(name: string) {
  const [view, setView] = useState<ViewPropertiesType | undefined>();
  const { encoded: encodedName } = encodeHelper(name);
  const { data, error, isLoading } = useSWR(
    `/view/${encodedName}/properties`,
    path => getApiRouteForCurrentDB().get(path),
    {
      revalidateOnFocus: false
    }
  );

  if (error) {
    window.App.navigate("#views", { trigger: true });
    window.arangoHelper.arangoError(
      "Failure",
      `Got unexpected server response: ${error.errorNum}: ${error.message} - ${name}`
    );
  }

  useEffect(() => {
    if (data) {
      const viewState = omit(data.body, "error", "code") as ViewPropertiesType;
      setView(viewState);
    }
  }, [data, name]);

  return { view, isLoading };
}
