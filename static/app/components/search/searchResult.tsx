import {Fragment} from 'react';
import styled from '@emotion/styled';

import {DocIntegrationAvatar} from 'sentry/components/core/avatar/docIntegrationAvatar';
import {SentryAppAvatar} from 'sentry/components/core/avatar/sentryAppAvatar';
import IdBadge from 'sentry/components/idBadge';
import {IconInput, IconLink, IconSettings} from 'sentry/icons';
import {PluginIcon} from 'sentry/plugins/components/pluginIcon';
import {space} from 'sentry/styles/space';
import highlightFuseMatches from 'sentry/utils/highlightFuseMatches';
import {useParams} from 'sentry/utils/useParams';

import type {Result} from './sources/types';

type Props = {
  highlighted: boolean;
  item: Result['item'];
  matches: Result['matches'];
};

const DEFAULT_AVATAR_SIZE = 24;

function renderResultType({resultType, model}: Result['item']) {
  switch (resultType) {
    case 'settings':
      return <IconSettings />;
    case 'field':
      return <IconInput />;
    case 'route':
      return <IconLink />;
    case 'integration':
      return <StyledPluginIcon size={DEFAULT_AVATAR_SIZE} pluginId={model.slug} />;
    case 'sentryApp':
      return <SentryAppAvatar size={DEFAULT_AVATAR_SIZE} sentryApp={model} />;
    case 'docIntegration':
      return <DocIntegrationAvatar size={DEFAULT_AVATAR_SIZE} docIntegration={model} />;
    default:
      return null;
  }
}

function HighlightedMarker(p: React.ComponentProps<typeof HighlightMarker>) {
  return <HighlightMarker data-test-id="highlight" {...p} />;
}

function SearchResult({item, matches, highlighted}: Props) {
  const params = useParams<{orgId: string}>();

  const {sourceType, model, extra} = item;

  function renderContent() {
    let {title, description} = item;

    if (matches) {
      const matchedTitle = matches?.find(({key}) => key === 'title');
      const matchedDescription = matches?.find(({key}) => key === 'description');

      title = matchedTitle
        ? highlightFuseMatches(matchedTitle, HighlightedMarker)
        : title;
      description = matchedDescription
        ? highlightFuseMatches(matchedDescription, HighlightedMarker)
        : description;
    }

    if (['organization', 'member', 'project', 'team'].includes(sourceType)) {
      const DescriptionNode = (
        <BadgeDetail highlighted={highlighted}>{description}</BadgeDetail>
      );

      const badgeProps = {
        displayName: title,
        description: DescriptionNode,
        hideEmail: true,
        useLink: false,
        orgId: params.orgId,
        avatarSize: 32,
        [sourceType]: model,
      };

      return <IdBadge {...badgeProps} />;
    }

    return (
      <Fragment>
        <div>{title}</div>
        {description && <SearchDetail>{description}</SearchDetail>}
        {extra && <ExtraDetail>{extra}</ExtraDetail>}
      </Fragment>
    );
  }

  return (
    <Wrapper>
      <Content>{renderContent()}</Content>
      <div>{renderResultType(item)}</div>
    </Wrapper>
  );
}

export default SearchResult;

const SearchDetail = styled('div')`
  font-size: 0.8em;
  line-height: 1.3;
  margin-top: 4px;
  opacity: 0.8;
`;

const ExtraDetail = styled('div')`
  font-size: ${p => p.theme.fontSize.sm};
  color: ${p => p.theme.subText};
  margin-top: ${space(0.5)};
`;

const BadgeDetail = styled('div')<{highlighted: boolean}>`
  line-height: 1.3;
  color: ${p => (p.highlighted ? p.theme.activeText : null)};
`;

const Wrapper = styled('div')`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: ${space(1)};
`;

const Content = styled('div')`
  display: flex;
  flex-direction: column;
`;

const StyledPluginIcon = styled(PluginIcon)`
  flex-shrink: 0;
`;

const HighlightMarker = styled('mark')`
  padding: 0;
  background: transparent;
  font-weight: ${p => p.theme.fontWeight.bold};
  color: ${p => p.theme.active};
`;
