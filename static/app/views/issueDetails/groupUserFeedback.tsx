import {Fragment} from 'react';
import {css} from '@emotion/react';
import styled from '@emotion/styled';

import {EventUserFeedback} from 'sentry/components/events/userFeedback';
import * as Layout from 'sentry/components/layouts/thirds';
import LoadingError from 'sentry/components/loadingError';
import LoadingIndicator from 'sentry/components/loadingIndicator';
import Pagination from 'sentry/components/pagination';
import {t} from 'sentry/locale';
import {space} from 'sentry/styles/space';
import {useLocation} from 'sentry/utils/useLocation';
import useOrganization from 'sentry/utils/useOrganization';
import {useParams} from 'sentry/utils/useParams';
import {useGroup} from 'sentry/views/issueDetails/useGroup';
import {useGroupUserFeedback} from 'sentry/views/issueDetails/useGroupUserFeedback';
import {useHasStreamlinedUI} from 'sentry/views/issueDetails/utils';
import {UserFeedbackEmpty} from 'sentry/views/userFeedback/userFeedbackEmpty';

function GroupUserFeedback() {
  const organization = useOrganization();
  const hasStreamlinedUI = useHasStreamlinedUI();
  const location = useLocation();
  const params = useParams<{groupId: string}>();

  const {
    data: group,
    isPending: isPendingGroup,
    isError: isErrorGroup,
    refetch: refetchGroup,
  } = useGroup({
    groupId: params.groupId,
  });

  const {
    data: reportList,
    isPending,
    isError,
    refetch,
    getResponseHeader,
  } = useGroupUserFeedback({
    groupId: params.groupId,
    query: {
      cursor: location.query.cursor as string | undefined,
    },
  });

  if (isError || isErrorGroup) {
    return (
      <LoadingError
        onRetry={() => {
          refetch();
          refetchGroup();
        }}
      />
    );
  }

  if (isPending || isPendingGroup) {
    return (
      <StyledLayoutBody hasStreamlinedUI={hasStreamlinedUI}>
        <Layout.Main fullWidth>
          <LoadingIndicator />
        </Layout.Main>
      </StyledLayoutBody>
    );
  }

  const pageLinks = getResponseHeader?.('Link');
  const hasUserFeedback = group.project.hasUserReports;

  return (
    <StyledLayoutBody hasStreamlinedUI={hasStreamlinedUI}>
      <Layout.Main fullWidth>
        {hasStreamlinedUI && hasUserFeedback && (
          <FilterMessage>
            {t('The feedback shown below is not subject to search filters.')}
            <StyledBreak />
          </FilterMessage>
        )}
        {reportList.length === 0 ? (
          <UserFeedbackEmpty projectIds={[group.project.id]} issueTab />
        ) : (
          <Fragment>
            {reportList.map((item, idx) => (
              <StyledEventUserFeedback
                key={idx}
                report={item}
                orgSlug={organization.slug}
                issueId={params.groupId}
              />
            ))}
            <Pagination pageLinks={pageLinks} />
          </Fragment>
        )}
      </Layout.Main>
    </StyledLayoutBody>
  );
}

const StyledEventUserFeedback = styled(EventUserFeedback)`
  margin-bottom: ${space(2)};
`;

const StyledLayoutBody = styled(Layout.Body)<{hasStreamlinedUI?: boolean}>`
  ${p =>
    p.hasStreamlinedUI &&
    css`
      border: 1px solid ${p.theme.border};
      border-radius: ${p.theme.borderRadius};
      padding: ${space(1.5)} 0;

      @media (min-width: ${p.theme.breakpoints.md}) {
        padding: ${space(1.5)};
      }
    `}
`;

const FilterMessage = styled('div')`
  color: ${p => p.theme.subText};
`;

const StyledBreak = styled('hr')`
  margin-top: ${space(1)};
  margin-bottom: ${space(1)};
  border-color: ${p => p.theme.border};
`;

export default GroupUserFeedback;
