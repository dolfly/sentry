import {useCallback, useMemo} from 'react';
import {type Theme, useTheme} from '@emotion/react';
import styled from '@emotion/styled';

import type {SelectOption, SelectSection} from 'sentry/components/core/compactSelect';
import {BreadcrumbSort} from 'sentry/components/events/interfaces/breadcrumbs';
import type {BreadcrumbMeta} from 'sentry/components/events/interfaces/breadcrumbs/types';
import {
  convertCrumbType,
  getVirtualCrumb,
} from 'sentry/components/events/interfaces/breadcrumbs/utils';
import type {TimelineItemProps} from 'sentry/components/timeline';
import {
  IconCode,
  IconCursorArrow,
  IconFire,
  IconFix,
  IconInfo,
  IconLocation,
  IconMobile,
  IconRefresh,
  IconSort,
  IconSpan,
  IconStack,
  IconUser,
  IconWarning,
  IconWifi,
} from 'sentry/icons';
import {t} from 'sentry/locale';
import {space} from 'sentry/styles/space';
import {
  BreadcrumbLevelType,
  BreadcrumbType,
  type RawCrumb,
} from 'sentry/types/breadcrumbs';
import {EntryType, type Event} from 'sentry/types/event';
import {toTitleCase} from 'sentry/utils/string/toTitleCase';
import {isChonkTheme} from 'sentry/utils/theme/withChonk';

const BREADCRUMB_TITLE_PLACEHOLDER = t('Generic');
const BREADCRUMB_SUMMARY_COUNT = 5;

export const enum BreadcrumbTimeDisplay {
  RELATIVE = 'relative',
  ABSOLUTE = 'absolute',
}
export const BREADCRUMB_TIME_DISPLAY_OPTIONS = {
  [BreadcrumbTimeDisplay.RELATIVE]: {
    label: t('Relative'),
    value: BreadcrumbTimeDisplay.RELATIVE,
  },
  [BreadcrumbTimeDisplay.ABSOLUTE]: {
    label: t('Absolute'),
    value: BreadcrumbTimeDisplay.ABSOLUTE,
  },
};
export const BREADCRUMB_TIME_DISPLAY_LOCALSTORAGE_KEY = 'event-breadcrumb-time-display';

const Color = styled('span')<{
  colorConfig: NonNullable<TimelineItemProps['colorConfig']>;
}>`
  color: ${p => p.colorConfig.icon};
`;

/**
 * Returns a summary of the provided breadcrumbs.
 * As of writing this, it just grabs a few, but in the future it may collapse,
 * or manipulate them in some way for a better summary.
 */
export function getSummaryBreadcrumbs(
  crumbs: readonly EnhancedCrumb[],
  sort: BreadcrumbSort
) {
  const sortedCrumbs = sort === BreadcrumbSort.OLDEST ? crumbs : crumbs.toReversed();
  return sortedCrumbs.slice(
    0,
    crumbs.length <= BREADCRUMB_SUMMARY_COUNT + 1
      ? BREADCRUMB_SUMMARY_COUNT + 1
      : BREADCRUMB_SUMMARY_COUNT
  );
}

function getBreadcrumbTypeOptions(crumbs: EnhancedCrumb[], theme: Theme) {
  const uniqueCrumbTypes = crumbs.reduce((crumbTypeSet, {breadcrumb: crumb}) => {
    crumbTypeSet.add(crumb.type);
    return crumbTypeSet;
  }, new Set<BreadcrumbType>());

  const typeOptions = [...uniqueCrumbTypes].map<SelectOption<string>>(crumbType => {
    const crumbFilter = getBreadcrumbFilter(crumbType);
    return {
      value: crumbFilter,
      label: crumbFilter,
      leadingItems: (
        <Color colorConfig={getBreadcrumbColorConfig(theme, crumbType)}>
          <BreadcrumbIcon type={crumbType} />
        </Color>
      ),
    };
  });
  return typeOptions.sort((a, b) => a.value.localeCompare(b.value));
}

function getBreadcrumbLevelOptions(crumbs: EnhancedCrumb[]) {
  const crumbLevels = crumbs.reduce(
    (crumbMap, ec) => {
      crumbMap[ec.breadcrumb.level] = ec.levelComponent;
      return crumbMap;
    },
    {} as Record<BreadcrumbLevelType, EnhancedCrumb['levelComponent']>
  );

  const levelOptions = Object.entries(crumbLevels).map<SelectOption<string>>(
    ([crumbLevel, levelComponent]) => {
      return {
        value: crumbLevel,
        label: levelComponent,
        textValue: crumbLevel,
      };
    }
  );
  return levelOptions.sort((a, b) => a.value.localeCompare(b.value));
}

export function useBreadcrumbFilters(crumbs: EnhancedCrumb[]) {
  const theme = useTheme();
  const filterOptions = useMemo(() => {
    const options: Array<SelectSection<string>> = [];
    const typeOptions = getBreadcrumbTypeOptions(crumbs, theme);
    if (typeOptions.length) {
      options.push({
        key: 'types',
        label: t('Types'),
        options: typeOptions.map(o => ({...o, value: `type-${o.value}`})),
      });
    }
    const levelOptions = getBreadcrumbLevelOptions(crumbs);
    if (levelOptions.length) {
      options.push({
        key: 'levels',
        label: t('Levels'),
        options: levelOptions.map(o => ({...o, value: `level-${o.value}`})),
      });
    }

    return options;
  }, [crumbs, theme]);

  const applyFilters = useCallback(
    (crumbsToFilter: EnhancedCrumb[], options: Array<SelectOption<string>['value']>) => {
      const typeFilterSet = new Set<string>();
      const levelFilterSet = new Set<string>();
      options.forEach(optionValue => {
        const [indicator, value] = optionValue.split('-');
        if (indicator === 'type') {
          typeFilterSet.add(value!);
        } else if (indicator === 'level') {
          levelFilterSet.add(value!);
        }
      });

      return crumbsToFilter.filter(ec => {
        if (typeFilterSet.size > 0 && !typeFilterSet.has(ec.filter)) {
          return false;
        }
        if (levelFilterSet.size > 0 && !levelFilterSet.has(ec.breadcrumb.level)) {
          return false;
        }
        return true;
      });
    },
    []
  );

  return {filterOptions, applyFilters};
}

export interface EnhancedCrumb {
  // Mutated crumb where we change types or virtual crumb
  breadcrumb: RawCrumb;
  colorConfig: ReturnType<typeof getBreadcrumbColorConfig>;
  filter: ReturnType<typeof getBreadcrumbFilter>;
  iconComponent: ReturnType<typeof BreadcrumbIcon>;
  levelComponent: React.ReactNode;
  // Display props
  title: ReturnType<typeof getBreadcrumbTitle>;
  meta?: BreadcrumbMeta;
  // Exact crumb extracted from the event. If raw is missing, crumb is virtual.
  raw?: RawCrumb;
}

/**
 * This is necessary to keep breadcrumbs with their associated meta annotations. The meta object for
 * crumbs on the event uses an array index, but in practice we append to the list (with virtual crumbs),
 * change the sort, and filter it. To avoid having to mutate the meta indeces, keep them together from the start.
 *
 * Display props are also added to reduce repeated iterations.
 */
export function getEnhancedBreadcrumbs(event: Event, theme: Theme): EnhancedCrumb[] {
  const breadcrumbEntryIndex =
    event.entries?.findIndex(entry => entry.type === EntryType.BREADCRUMBS) ?? -1;
  const breadcrumbs: any[] = event.entries?.[breadcrumbEntryIndex]?.data?.values ?? [];

  if (breadcrumbs.length === 0) {
    return [];
  }

  // Mapping of breadcrumb index -> breadcrumb meta
  const meta: Record<number, any> =
    event._meta?.entries?.[breadcrumbEntryIndex]?.data?.values ?? {};

  const enhancedCrumbs = breadcrumbs.map<
    Pick<EnhancedCrumb, 'raw' | 'meta' | 'breadcrumb'>
  >((raw, i) => ({
    raw,
    meta: meta[i],
    // Converts breadcrumbs into other types if sufficient data is present.
    breadcrumb: convertCrumbType(raw),
  }));

  // The virtual crumb is a representation of this event, displayed alongside
  // the rest of the breadcrumbs for more additional context.
  const virtualCrumb = getVirtualCrumb(event);
  const allCrumbs = virtualCrumb
    ? [...enhancedCrumbs, {breadcrumb: virtualCrumb}]
    : enhancedCrumbs;

  // Add display props
  return allCrumbs.map<EnhancedCrumb>(ec => ({
    ...ec,
    title: getBreadcrumbTitle(ec.breadcrumb),
    colorConfig: getBreadcrumbColorConfig(theme, ec.breadcrumb.type),
    filter: getBreadcrumbFilter(ec.breadcrumb.type),
    iconComponent: <BreadcrumbIcon type={ec.breadcrumb.type} />,
    levelComponent: (
      <BreadcrumbLevel level={ec.breadcrumb.level}>{ec.breadcrumb.level}</BreadcrumbLevel>
    ),
  }));
}

function getBreadcrumbTitle(crumb: RawCrumb) {
  if (crumb?.type === BreadcrumbType.DEFAULT) {
    return crumb?.category ?? BREADCRUMB_TITLE_PLACEHOLDER.toLocaleLowerCase();
  }

  switch (crumb?.category) {
    case 'http':
    case 'xhr':
      return crumb?.category.toUpperCase();
    case 'ui.click':
      return t('UI Click');
    case 'ui.input':
      return t('UI Input');
    case null:
    case undefined:
      return BREADCRUMB_TITLE_PLACEHOLDER.toLocaleLowerCase();
    default: {
      const titleCategory = crumb?.category.split('.').join(' ');
      return toTitleCase(titleCategory, {allowInnerUpperCase: true});
    }
  }
}

function getBreadcrumbColorConfig(
  theme: Theme,
  type?: BreadcrumbType
): NonNullable<TimelineItemProps['colorConfig']> {
  switch (type) {
    case BreadcrumbType.ERROR:
      return {title: theme.red400, icon: theme.red400, iconBorder: theme.red200};
    case BreadcrumbType.WARNING:
      return {title: theme.yellow400, icon: theme.yellow400, iconBorder: theme.yellow200};
    case BreadcrumbType.NAVIGATION:
    case BreadcrumbType.HTTP:
    case BreadcrumbType.QUERY:
    case BreadcrumbType.TRANSACTION:
      return {title: theme.green400, icon: theme.green400, iconBorder: theme.green200};
    case BreadcrumbType.USER:
    case BreadcrumbType.UI:
      return {title: theme.purple400, icon: theme.purple400, iconBorder: theme.purple200};
    case BreadcrumbType.SYSTEM:
    case BreadcrumbType.SESSION:
    case BreadcrumbType.DEVICE:
    case BreadcrumbType.NETWORK:
    case BreadcrumbType.CONNECTIVITY:
      return {title: theme.pink400, icon: theme.pink400, iconBorder: theme.pink200};
    case BreadcrumbType.INFO:
      return {title: theme.blue400, icon: theme.blue300, iconBorder: theme.blue200};
    case BreadcrumbType.DEBUG:
    default:
      if (isChonkTheme(theme)) {
        return {
          title: theme.colors.content.primary,
          icon: theme.colors.content.muted,
          iconBorder: theme.colors.content.muted,
        };
      }
      return {title: theme.gray400, icon: theme.gray300, iconBorder: theme.gray200};
  }
}

function getBreadcrumbFilter(type?: BreadcrumbType) {
  switch (type) {
    case BreadcrumbType.USER:
    case BreadcrumbType.UI:
      return t('User Action');
    case BreadcrumbType.NAVIGATION:
      return t('Navigation');
    case BreadcrumbType.DEBUG:
      return t('Debug');
    case BreadcrumbType.INFO:
      return t('Info');
    case BreadcrumbType.ERROR:
      return t('Error');
    case BreadcrumbType.HTTP:
      return t('HTTP Request');
    case BreadcrumbType.WARNING:
      return t('Warning');
    case BreadcrumbType.QUERY:
      return t('Query');
    case BreadcrumbType.SYSTEM:
      return t('System');
    case BreadcrumbType.SESSION:
      return t('Session');
    case BreadcrumbType.TRANSACTION:
      return t('Transaction');
    case BreadcrumbType.DEVICE:
      return t('Device');
    case BreadcrumbType.NETWORK:
      return t('Network');
    case BreadcrumbType.CONNECTIVITY:
      return t('Connectivity');
    default:
      return BREADCRUMB_TITLE_PLACEHOLDER;
  }
}

function BreadcrumbIcon({type}: {type?: BreadcrumbType}) {
  switch (type) {
    case BreadcrumbType.USER:
      return <IconUser size="xs" />;
    case BreadcrumbType.UI:
      return <IconCursorArrow size="xs" />;
    case BreadcrumbType.NAVIGATION:
      return <IconLocation size="xs" />;
    case BreadcrumbType.DEBUG:
      return <IconFix size="xs" />;
    case BreadcrumbType.INFO:
      return <IconInfo size="xs" />;
    case BreadcrumbType.ERROR:
      return <IconFire size="xs" />;
    case BreadcrumbType.HTTP:
      return <IconSort size="xs" rotated />;
    case BreadcrumbType.WARNING:
      return <IconWarning size="xs" />;
    case BreadcrumbType.QUERY:
      return <IconStack size="xs" />;
    case BreadcrumbType.SYSTEM:
      return <IconMobile size="xs" />;
    case BreadcrumbType.SESSION:
      return <IconRefresh size="xs" />;
    case BreadcrumbType.TRANSACTION:
      return <IconSpan size="xs" />;
    case BreadcrumbType.DEVICE:
      return <IconMobile size="xs" />;
    case BreadcrumbType.NETWORK:
    case BreadcrumbType.CONNECTIVITY:
      return <IconWifi size="xs" />;
    default:
      return <IconCode size="xs" />;
  }
}

const BreadcrumbLevel = styled('div')<{level: BreadcrumbLevelType}>`
  margin: 0 ${space(1)};
  font-weight: normal;
  font-size: ${p => p.theme.fontSize.sm};
  border: 0;
  background: none;
  color: ${p => {
    switch (p.level) {
      case BreadcrumbLevelType.ERROR:
      case BreadcrumbLevelType.FATAL:
        return p.theme.red400;
      case BreadcrumbLevelType.WARNING:
        return p.theme.yellow400;
      default:
      case BreadcrumbLevelType.DEBUG:
      case BreadcrumbLevelType.INFO:
      case BreadcrumbLevelType.LOG:
        return p.theme.subText;
    }
  }};
  display: ${p => (p.level === BreadcrumbLevelType.UNDEFINED ? 'none' : 'block')};
`;
