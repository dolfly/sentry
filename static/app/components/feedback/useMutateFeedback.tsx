import {useCallback} from 'react';

import useFeedbackCache from 'sentry/components/feedback/useFeedbackCache';
import useFeedbackQueryKeys from 'sentry/components/feedback/useFeedbackQueryKeys';
import type {Actor} from 'sentry/types/core';
import type {GroupStatus} from 'sentry/types/group';
import type {Organization} from 'sentry/types/organization';
import type {MutateOptions} from 'sentry/utils/queryClient';
import {fetchMutation, useMutation} from 'sentry/utils/queryClient';

type TFeedbackIds = 'all' | string[];
type TPayload =
  | {hasSeen: boolean}
  | {status: GroupStatus}
  | {assignedTo: Actor | undefined};
type TData = unknown;
type TError = unknown;
type TVariables = [TFeedbackIds, TPayload];
type TContext = unknown;

interface Props {
  feedbackIds: TFeedbackIds;
  organization: Organization;
  projectIds: string[];
}

export default function useMutateFeedback({
  feedbackIds,
  organization,
  projectIds,
}: Props) {
  const {listQueryKey} = useFeedbackQueryKeys();
  const {updateCached, invalidateCached} = useFeedbackCache();

  const {mutate} = useMutation<TData, TError, TVariables, TContext>({
    onMutate: ([ids, payload]) => {
      updateCached(ids, payload);
    },
    mutationFn: ([ids, payload]) => {
      const isSingleId = ids !== 'all' && ids.length === 1;
      const url = isSingleId
        ? `/organizations/${organization.slug}/issues/${ids[0]}/`
        : `/organizations/${organization.slug}/issues/`;

      // TODO: it would be excellent if `PUT /issues/` could return the same data
      // as `GET /issues/` when query params are set. IE: it should expand inbox & owners
      // Then we could push new data into the cache instead of re-fetching it again
      const options = isSingleId
        ? {}
        : ids === 'all'
          ? listQueryKey?.[2]!
          : {query: {id: ids, project: projectIds}};
      return fetchMutation({method: 'PUT', url, options, data: payload});
    },
    onSettled: (_resp, _error, [ids, _payload]) => {
      invalidateCached(ids);
    },
    gcTime: 0,
  });

  const markAsRead = useCallback(
    (hasSeen: boolean, options?: MutateOptions<TData, TError, TVariables, TContext>) => {
      mutate([feedbackIds, {hasSeen}], options);
    },
    [mutate, feedbackIds]
  );

  const resolve = useCallback(
    (
      status: GroupStatus,
      options?: MutateOptions<TData, TError, TVariables, TContext>
    ) => {
      mutate([feedbackIds, {status}], options);
    },
    [mutate, feedbackIds]
  );

  return {
    markAsRead,
    resolve,
  };
}
