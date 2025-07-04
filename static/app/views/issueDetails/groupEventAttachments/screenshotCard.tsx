import {useState} from 'react';
import styled from '@emotion/styled';

import {openModal} from 'sentry/actionCreators/modal';
import Card from 'sentry/components/card';
import {openConfirmModal} from 'sentry/components/confirm';
import {Button} from 'sentry/components/core/button';
import {Link} from 'sentry/components/core/link';
import {Tooltip} from 'sentry/components/core/tooltip';
import {DateTime} from 'sentry/components/dateTime';
import {DropdownMenu} from 'sentry/components/dropdownMenu';
import ImageVisualization from 'sentry/components/events/eventTagsAndScreenshot/screenshot/imageVisualization';
import ScreenshotModal, {
  modalCss,
} from 'sentry/components/events/eventTagsAndScreenshot/screenshot/modal';
import {LazyRender} from 'sentry/components/lazyRender';
import LoadingIndicator from 'sentry/components/loadingIndicator';
import PanelBody from 'sentry/components/panels/panelBody';
import {IconEllipsis} from 'sentry/icons/iconEllipsis';
import {t} from 'sentry/locale';
import {space} from 'sentry/styles/space';
import type {IssueAttachment} from 'sentry/types/group';
import type {Project} from 'sentry/types/project';
import {trackAnalytics} from 'sentry/utils/analytics';
import {getShortEventId} from 'sentry/utils/events';
import useOrganization from 'sentry/utils/useOrganization';

type Props = {
  attachments: IssueAttachment[];
  eventAttachment: IssueAttachment;
  eventId: string;
  groupId: string;
  onDelete: (attachment: IssueAttachment) => void;
  projectSlug: Project['slug'];
};

export function ScreenshotCard({
  eventAttachment,
  attachments,
  groupId,
  projectSlug,
  eventId,
  onDelete,
}: Props) {
  const organization = useOrganization();
  const [loadingImage, setLoadingImage] = useState(true);

  const downloadUrl = `/api/0/projects/${organization.slug}/${projectSlug}/events/${eventId}/attachments/${eventAttachment.id}/?download=1`;

  function handleDelete() {
    trackAnalytics('issue_details.attachment_tab.screenshot_modal_deleted', {
      organization,
    });
    onDelete(eventAttachment);
  }

  function openVisualizationModal() {
    trackAnalytics('issue_details.attachment_tab.screenshot_modal_opened', {
      organization,
    });
    openModal(
      modalProps => (
        <ScreenshotModal
          {...modalProps}
          projectSlug={projectSlug}
          groupId={groupId}
          eventAttachment={eventAttachment}
          downloadUrl={downloadUrl}
          onDelete={handleDelete}
          attachments={attachments}
          onDownload={() =>
            trackAnalytics('issue_details.attachment_tab.screenshot_modal_download', {
              organization,
            })
          }
        />
      ),
      {modalCss}
    );
  }

  return (
    <StyledCard>
      <CardHeader>
        <ScreenshotInfo>
          <Tooltip title={eventAttachment.name} showOnlyOnOverflow skipWrapper>
            <AttachmentName>{eventAttachment.name}</AttachmentName>
          </Tooltip>
          <div>
            <DateTime date={eventAttachment.dateCreated} /> &middot;{' '}
            <Link
              to={`/organizations/${organization.slug}/issues/${groupId}/events/${eventAttachment.event_id}/`}
            >
              <Tooltip skipWrapper title={t('View Event')}>
                {getShortEventId(eventAttachment.event_id)}
              </Tooltip>
            </Link>
          </div>
        </ScreenshotInfo>
        <DropdownMenu
          items={[
            {
              key: 'download',
              label: t('Download'),
              onAction: () => {
                window.open(downloadUrl, '_blank');
              },
            },
            {
              key: 'delete',
              label: t('Delete'),
              onAction: () => {
                openConfirmModal({
                  onConfirm: () => onDelete(eventAttachment),
                  message: <h6>{t('Are you sure you want to delete this image?')}</h6>,
                  priority: 'danger',
                  confirmText: t('Delete'),
                });
              },
              priority: 'danger',
            },
          ]}
          position="bottom-end"
          trigger={triggerProps => (
            <Button
              {...triggerProps}
              aria-label={t('Actions')}
              size="xs"
              borderless
              icon={<IconEllipsis direction="down" size="sm" />}
            />
          )}
        />
      </CardHeader>
      <CardBody>
        <StyledPanelBody
          onClick={() => openVisualizationModal()}
          data-test-id={`screenshot-${eventAttachment.id}`}
        >
          <LazyRender containerHeight={250} withoutContainer>
            <StyledImageVisualization
              attachment={eventAttachment}
              orgSlug={organization.slug}
              projectSlug={projectSlug}
              eventId={eventId}
              onLoad={() => setLoadingImage(false)}
              onError={() => setLoadingImage(false)}
            />
            {loadingImage && (
              <StyledLoadingIndicator>
                <LoadingIndicator mini />
              </StyledLoadingIndicator>
            )}
          </LazyRender>
        </StyledPanelBody>
      </CardBody>
    </StyledCard>
  );
}

const ScreenshotInfo = styled('div')`
  display: flex;
  flex-direction: column;
  min-width: 0;
`;

const StyledCard = styled(Card)`
  margin: 0;
  padding: ${space(1)} ${space(1.5)};
`;

const AttachmentName = styled('span')`
  display: flex;
  font-weight: ${p => p.theme.fontWeight.bold};
  ${p => p.theme.overflowEllipsis};
`;

const CardHeader = styled('div')`
  display: flex;
  justify-content: space-between;
  padding-bottom: ${space(1)};
  flex-shrink: 0;
`;

const CardBody = styled('div')`
  max-height: 250px;
  min-height: 250px;
  overflow: hidden;
  border-bottom: 1px solid ${p => p.theme.gray100};
`;

const StyledPanelBody = styled(PanelBody)`
  height: 100%;
  min-height: 48px;
  overflow: hidden;
  cursor: pointer;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  border-radius: ${p => p.theme.borderRadius};
`;

const StyledLoadingIndicator = styled('div')`
  align-self: center;
`;

const StyledImageVisualization = styled(ImageVisualization)`
  height: 100%;
  z-index: 1;
  border: 0;
`;
