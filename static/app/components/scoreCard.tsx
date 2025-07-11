import type {Theme} from '@emotion/react';
import styled from '@emotion/styled';

import Panel from 'sentry/components/panels/panel';
import QuestionTooltip from 'sentry/components/questionTooltip';
import TextOverflow from 'sentry/components/textOverflow';
import {space} from 'sentry/styles/space';
import {defined} from 'sentry/utils';

type ScoreCardProps = {
  title: React.ReactNode;
  className?: string;
  help?: React.ReactNode;
  isEstimate?: boolean;
  isTooltipHoverable?: boolean;
  renderOpenButton?: () => React.ReactNode;
  score?: React.ReactNode;
  trend?: React.ReactNode;
  trendStatus?: 'good' | 'bad';
};

export function ScoreCard({
  title,
  score,
  help,
  trend,
  trendStatus,
  className,
  renderOpenButton,
  isTooltipHoverable,
}: ScoreCardProps) {
  const displayScore = score ?? '\u2014';

  return (
    <ScorePanel className={className}>
      <HeaderWrapper>
        <HeaderTitle>
          <Title>{title}</Title>
          {help && (
            <QuestionTooltip
              title={help}
              size="sm"
              position="top"
              isHoverable={isTooltipHoverable}
            />
          )}
        </HeaderTitle>
        {renderOpenButton?.()}
      </HeaderWrapper>

      <ScoreWrapper>
        <Score>{displayScore}</Score>
        {defined(trend) && (
          <Trend trendStatus={trendStatus}>
            <TextOverflow>{trend}</TextOverflow>
          </Trend>
        )}
      </ScoreWrapper>
    </ScorePanel>
  );
}

function getTrendColor(p: TrendProps & {theme: Theme}) {
  switch (p.trendStatus) {
    case 'good':
      return p.theme.successText;
    case 'bad':
      return p.theme.errorText;
    default:
      return p.theme.subText;
  }
}

export const ScorePanel = styled(Panel)`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: ${space(2)} ${space(3)};
  min-height: 96px;
`;

const HeaderTitle = styled('div')`
  display: inline-grid;
  grid-auto-flow: column;
  gap: ${space(1)};
  align-items: center;
  width: fit-content;
`;

export const Title = styled('div')`
  font-size: ${p => p.theme.fontSize.lg};
  color: ${p => p.theme.headingColor};
  ${p => p.theme.overflowEllipsis};
  font-weight: ${p => p.theme.fontWeight.bold};
`;

const HeaderWrapper = styled('div')`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
`;

export const ScoreWrapper = styled('div')`
  display: flex;
  flex-direction: row;
  align-items: baseline;
  max-width: 100%;
`;

export const Score = styled('span')`
  flex-shrink: 1;
  font-size: 32px;
  line-height: 1;
  color: ${p => p.theme.headingColor};
  white-space: nowrap;
`;

type TrendProps = {trendStatus: ScoreCardProps['trendStatus']};

export const Trend = styled('div')<TrendProps>`
  color: ${getTrendColor};
  margin-left: ${space(1)};
  line-height: 1;
  overflow: hidden;
`;
