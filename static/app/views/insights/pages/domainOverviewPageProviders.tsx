import NoProjectMessage from 'sentry/components/noProjectMessage';
import PageFiltersContainer from 'sentry/components/organizations/pageFilters/container';
import SentryDocumentTitle from 'sentry/components/sentryDocumentTitle';
import {MEPSettingProvider} from 'sentry/utils/performance/contexts/metricsEnhancedSetting';
import {useLocation} from 'sentry/utils/useLocation';
import useOrganization from 'sentry/utils/useOrganization';
import {OVERVIEW_PAGE_TITLE} from 'sentry/views/insights/pages/settings';
import {useDomainViewFilters} from 'sentry/views/insights/pages/useFilters';

export function DomainOverviewPageProviders({children}: {children: React.ReactNode}) {
  const organization = useOrganization();
  const location = useLocation();
  const {view} = useDomainViewFilters();

  return (
    <NoProjectMessage organization={organization}>
      <PageFiltersContainer storageNamespace={view}>
        <SentryDocumentTitle title={OVERVIEW_PAGE_TITLE} orgSlug={organization.slug}>
          <MEPSettingProvider location={location}>{children}</MEPSettingProvider>
        </SentryDocumentTitle>
      </PageFiltersContainer>
    </NoProjectMessage>
  );
}
