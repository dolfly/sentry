import {Fragment} from 'react';
import styled from '@emotion/styled';

import Confirm from 'sentry/components/confirm';
import {Button} from 'sentry/components/core/button';
import {Link} from 'sentry/components/core/link';
import {Tooltip} from 'sentry/components/core/tooltip';
import Placeholder from 'sentry/components/placeholder';
import TimeSince from 'sentry/components/timeSince';
import {IconDelete} from 'sentry/icons';
import {t, tct} from 'sentry/locale';
import {space} from 'sentry/styles/space';
import type {Organization} from 'sentry/types/organization';
import type {Project} from 'sentry/types/project';
import type {OrgAuthToken} from 'sentry/types/user';
import getDynamicText from 'sentry/utils/getDynamicText';
import {tokenPreview} from 'sentry/views/settings/organizationAuthTokens';

function LastUsed({
  organization,
  dateLastUsed,
  projectLastUsed,
}: {
  organization: Organization;
  dateLastUsed?: Date;
  projectLastUsed?: Project;
}) {
  if (dateLastUsed && projectLastUsed) {
    return (
      <Fragment>
        {tct('[date] in project [project]', {
          date: (
            <TimeSince
              date={getDynamicText({
                value: dateLastUsed,
                fixed: new Date(1508208080000), // National Pasta Day
              })}
            />
          ),
          project: (
            <Link to={`/settings/${organization.slug}/projects/${projectLastUsed.slug}/`}>
              {projectLastUsed.name}
            </Link>
          ),
        })}
      </Fragment>
    );
  }

  if (dateLastUsed) {
    return (
      <Fragment>
        <TimeSince
          date={getDynamicText({
            value: dateLastUsed,
            fixed: new Date(1508208080000), // National Pasta Day
          })}
        />
      </Fragment>
    );
  }

  if (projectLastUsed) {
    return (
      <Fragment>
        {tct('in project [project]', {
          project: (
            <Link to={`/settings/${organization.slug}/${projectLastUsed.slug}/`}>
              {projectLastUsed.name}
            </Link>
          ),
        })}
      </Fragment>
    );
  }

  return <NeverUsed>{t('never used')}</NeverUsed>;
}

export function OrganizationAuthTokensAuthTokenRow({
  organization,
  isRevoking,
  token,
  revokeToken,
  projectLastUsed,
  isProjectLoading,
}: {
  isRevoking: boolean;
  organization: Organization;
  token: OrgAuthToken;
  isProjectLoading?: boolean;
  projectLastUsed?: Project;
  revokeToken?: (token: OrgAuthToken) => void;
}) {
  return (
    <Fragment>
      <div>
        <Label>
          <Link to={`/settings/${organization.slug}/auth-tokens/${token.id}/`}>
            {token.name}
          </Link>
        </Label>

        {token.tokenLastCharacters && (
          <TokenPreview aria-label={t('Token preview')}>
            {tokenPreview(
              getDynamicText({
                value: token.tokenLastCharacters,
                fixed: 'ABCD',
              }),
              'sntrys_'
            )}
          </TokenPreview>
        )}
      </div>

      <DateTime>
        {isProjectLoading ? (
          <Placeholder height="1.25em" />
        ) : (
          <Fragment>
            <TimeSince
              date={getDynamicText({
                value: token.dateCreated,
                fixed: new Date(1508208080000), // National Pasta Day
              })}
            />
          </Fragment>
        )}
      </DateTime>

      <DateTime>
        {isProjectLoading ? (
          <Placeholder height="1.25em" />
        ) : (
          <LastUsed
            dateLastUsed={token.dateLastUsed}
            projectLastUsed={projectLastUsed}
            organization={organization}
          />
        )}
      </DateTime>

      <Actions>
        <Tooltip
          title={t('You must be an organization owner or manager to revoke a token.')}
          disabled={!!revokeToken}
        >
          <Confirm
            disabled={!revokeToken || isRevoking}
            onConfirm={revokeToken ? () => revokeToken(token) : undefined}
            message={t(
              'Are you sure you want to revoke %s token? It will not be usable anymore, and this cannot be undone.',
              tokenPreview(token.tokenLastCharacters || '', 'sntrys_')
            )}
          >
            <Button
              size="sm"
              disabled={isRevoking || !revokeToken}
              aria-label={t('Revoke %s', token.name)}
              icon={<IconDelete />}
            >
              {t('Revoke')}
            </Button>
          </Confirm>
        </Tooltip>
      </Actions>
    </Fragment>
  );
}

const Label = styled('div')``;

const Actions = styled('div')`
  display: flex;
  justify-content: flex-end;
`;

const DateTime = styled('div')`
  display: flex;
  align-items: center;
  gap: ${space(0.5)};
`;

const NeverUsed = styled('div')`
  color: ${p => p.theme.subText};
`;

const TokenPreview = styled('div')`
  color: ${p => p.theme.subText};
`;
