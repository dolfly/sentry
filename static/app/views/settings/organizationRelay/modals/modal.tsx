import {Fragment} from 'react';

import type {ModalRenderProps} from 'sentry/actionCreators/modal';
import {Button} from 'sentry/components/core/button';
import {ButtonBar} from 'sentry/components/core/button/buttonBar';
import {t} from 'sentry/locale';

type Props = {
  content: React.ReactElement;
  disabled: boolean;
  onSave: () => void;
  title: string;
  btnSaveLabel?: string;
} & ModalRenderProps;

function Modal({
  title,
  onSave,
  content,
  disabled,
  Header,
  Body,
  Footer,
  closeModal,
  btnSaveLabel = t('Save'),
}: Props) {
  return (
    <Fragment>
      <Header closeButton>{title}</Header>
      <Body>{content}</Body>
      <Footer>
        <ButtonBar gap="lg">
          <Button onClick={closeModal}>{t('Cancel')}</Button>
          <Button
            onClick={event => {
              event.preventDefault();
              onSave();
            }}
            disabled={disabled}
            type="submit"
            priority="primary"
            form="relay-form"
          >
            {btnSaveLabel}
          </Button>
        </ButtonBar>
      </Footer>
    </Fragment>
  );
}

export default Modal;
