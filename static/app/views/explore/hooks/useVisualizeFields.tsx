import {useMemo} from 'react';

import type {SelectOption} from 'sentry/components/core/compactSelect';
import {t} from 'sentry/locale';
import type {TagCollection} from 'sentry/types/group';
import {defined} from 'sentry/utils';
import type {ParsedFunction} from 'sentry/utils/discover/fields';
import {
  AggregationKey,
  FieldKind,
  NO_ARGUMENT_SPAN_AGGREGATES,
  prettifyTagKey,
} from 'sentry/utils/fields';
import {AttributeDetails} from 'sentry/views/explore/components/attributeDetails';
import {TypeBadge} from 'sentry/views/explore/components/typeBadge';
import {TraceItemDataset} from 'sentry/views/explore/types';
import {SpanFields} from 'sentry/views/insights/types';

interface UseVisualizeFieldsProps {
  numberTags: TagCollection;
  stringTags: TagCollection;
  traceItemType: TraceItemDataset;
  parsedFunction?: ParsedFunction | null;
}

export function useVisualizeFields({
  parsedFunction,
  numberTags,
  stringTags,
  traceItemType,
}: UseVisualizeFieldsProps) {
  const [kind, tags]: [FieldKind, TagCollection] = useMemo(() => {
    return getSupportedAttributes({
      functionName: parsedFunction?.name || '',
      numberTags,
      stringTags,
      traceItemType,
    });
  }, [parsedFunction, numberTags, stringTags, traceItemType]);

  const unknownField = parsedFunction?.arguments[0];

  const fieldOptions: Array<SelectOption<string>> = useMemo(() => {
    const unknownOptions = [unknownField]
      .filter(defined)
      .filter(option => !tags.hasOwnProperty(option));

    const options = [
      ...unknownOptions.map(option => {
        const label = prettifyTagKey(option);
        return {
          label,
          value: option,
          textValue: option,
          trailingItems: <TypeBadge kind={kind} />,
          showDetailsInOverlay: true,
          details: (
            <AttributeDetails
              column={option}
              kind={kind}
              label={label}
              traceItemType={traceItemType}
            />
          ),
        };
      }),
      ...Object.values(tags).map(tag => {
        return {
          label: tag.name,
          value: tag.key,
          textValue: tag.name,
          trailingItems: <TypeBadge kind={kind} />,
          showDetailsInOverlay: true,
          details: (
            <AttributeDetails
              column={tag.key}
              kind={kind}
              label={tag.name}
              traceItemType={traceItemType}
            />
          ),
        };
      }),
    ];

    options.sort((a, b) => {
      if (a.label < b.label) {
        return -1;
      }

      if (a.label > b.label) {
        return 1;
      }

      return 0;
    });

    return options;
  }, [kind, tags, unknownField, traceItemType]);

  return fieldOptions;
}

function getSupportedAttributes({
  functionName,
  numberTags,
  stringTags,
  traceItemType,
}: {
  numberTags: TagCollection;
  stringTags: TagCollection;
  traceItemType: TraceItemDataset;
  functionName?: string;
}): [FieldKind, TagCollection] {
  if (traceItemType === TraceItemDataset.SPANS) {
    if (functionName === AggregationKey.COUNT) {
      const countTags: TagCollection = {
        [SpanFields.SPAN_DURATION]: {
          name: t('spans'),
          key: SpanFields.SPAN_DURATION,
        },
      };
      return [FieldKind.MEASUREMENT, countTags];
    }

    if (NO_ARGUMENT_SPAN_AGGREGATES.includes(functionName as AggregationKey)) {
      const countTags: TagCollection = {
        '': {
          name: t('spans'),
          key: '',
        },
      };
      return [FieldKind.MEASUREMENT, countTags];
    }

    if (functionName === AggregationKey.COUNT_UNIQUE) {
      return [FieldKind.TAG, stringTags];
    }

    return [FieldKind.MEASUREMENT, numberTags];
  }

  throw new Error('Cannot get support attributes for unknown trace item type');
}
