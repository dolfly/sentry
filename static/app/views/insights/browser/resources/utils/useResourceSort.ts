import type {Sort} from 'sentry/utils/discover/fields';
import {decodeSorts} from 'sentry/utils/queryString';
import {useLocation} from 'sentry/utils/useLocation';
import type {QueryParameterNames} from 'sentry/views/insights/common/views/queryParameters';
import {SpanFields} from 'sentry/views/insights/types';

const {SPAN_SELF_TIME, NORMALIZED_DESCRIPTION, HTTP_RESPONSE_CONTENT_LENGTH} = SpanFields;

type Query = {
  sort?: string;
};

const SORTABLE_FIELDS = [
  `avg(${SPAN_SELF_TIME})`,
  NORMALIZED_DESCRIPTION,
  'epm()',
  `avg(${HTTP_RESPONSE_CONTENT_LENGTH})`,
  `sum(${SPAN_SELF_TIME})`,
] as const;

export type ValidSort = Sort & {
  field: (typeof SORTABLE_FIELDS)[number];
};

/**
 * Parses a `Sort` object from the URL. In case of multiple specified sorts
 * picks the first one, since span module UIs only support one sort at a time.
 */
export function useResourceSort(
  sortParameterName: QueryParameterNames | 'sort' = 'sort',
  fallback: ValidSort = DEFAULT_SORT
): ValidSort {
  const location = useLocation<Query>();

  return (
    // @ts-expect-error TS(7053): Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
    decodeSorts(location.query[sortParameterName]).find(isAValidSort) ?? fallback
  );
}

const DEFAULT_SORT: ValidSort = {
  kind: 'desc',
  field: 'sum(span.self_time)',
};

function isAValidSort(sort: Sort): sort is ValidSort {
  return (SORTABLE_FIELDS as unknown as string[]).includes(sort.field);
}
