import React from 'react';
import TopLevelGroup from '@/settings/components/top-level-group';
import useSettingGroup from '@/settings/hooks/use-setting-group';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@tryghost/shade/components';
import { RefreshCw } from 'lucide-react';
import { SettingGroupContent } from '@tryghost/shade/patterns';
import {
  getSettingValues,
  isSettingReadOnly,
  useRegenerateAccessCode,
} from '@tryghost/admin-x-framework/api/settings';
import { toast } from 'sonner';
import { useGlobalData } from '@/settings/providers/global-data-context';
import { withErrorBoundary } from '@/settings/components/with-error-boundary';

const SITE_VISIBILITY_OPTIONS = [
  {
    value: 'public',
    label: 'Public',
    hint: 'Anyone can visit and read the website',
  },
  {
    value: 'private',
    label: 'Private',
    hint: 'Access code required',
  },
];

const renderAccessOptions = (options: Array<{ value: string; label: string; hint: string }>) =>
  options.map((option) => (
    <SelectItem key={option.value} value={option.value}>
      <span className="flex flex-col">
        <span>{option.label}</span>
        <span className="text-sm text-muted-foreground">{option.hint}</span>
      </span>
    </SelectItem>
  ));

const getAccessOptionLabel = (options: Array<{ value: string; label: string }>, value: string) =>
  options.find((option) => option.value === value)?.label;

const SiteAccess: React.FC<{ keywords: string[] }> = ({ keywords }) => {
  const { settings } = useGlobalData();
  const isPrivateLocked =
    isSettingReadOnly(settings, 'is_private') || isSettingReadOnly(settings, 'password');
  const { mutateAsync: regenerateAccessCode } = useRegenerateAccessCode();
  const [isRegenerating, setIsRegenerating] = React.useState(false);
  const {
    localSettings,
    isEditing,
    saveState,
    siteData,
    handleSave,
    handleCancel,
    updateSetting,
    handleEditingChange,
    errors,
    clearError,
  } = useSettingGroup({
    onValidate: () => {
      if (isPrivate && !password) {
        return {
          password: 'Enter an access code',
        };
      }

      return {};
    },
  });

  const [isPrivate, password] = getSettingValues(localSettings, ['is_private', 'password']) as [
    boolean,
    string,
  ];
  const [savedIsPrivate, savedPublicHash] = getSettingValues(settings, [
    'is_private',
    'public_hash',
  ]) as [boolean, string];
  const effectiveIsPrivate = isPrivateLocked ? true : isPrivate;
  const privateRssUrl =
    savedIsPrivate && effectiveIsPrivate && siteData?.url && savedPublicHash
      ? `${siteData.url.replace(/\/$/, '')}/${savedPublicHash}/rss`
      : null;

  const handleRegenerateAccessCode = async () => {
    setIsRegenerating(true);
    try {
      const response = await regenerateAccessCode(null);
      const regeneratedAccessCode = response.settings.find(
        (setting) => setting.key === 'password',
      )?.value;

      if (typeof regeneratedAccessCode === 'string') {
        updateSetting('password', regeneratedAccessCode);
        clearError('password');
      }
    } catch {
      toast.error('Could not regenerate access code');
    } finally {
      setIsRegenerating(false);
    }
  };

  const form = (
    <SettingGroupContent className="gap-y-4" columns={1}>
      <div className="flex flex-col content-center items-center gap-4 md:flex-row">
        <div className="w-full max-w-none min-w-[160px] md:w-2/3 md:max-w-[320px]">
          Who should be able to browse your site?
        </div>
        <div className="w-full md:flex-1">
          <Field
            className={isPrivateLocked ? 'relative z-10' : undefined}
            data-disabled={isPrivateLocked || undefined}
          >
            <FieldLabel className="sr-only">Who should be able to browse your site?</FieldLabel>
            <Select
              disabled={isPrivateLocked}
              value={effectiveIsPrivate ? 'private' : 'public'}
              onValueChange={(value) => {
                updateSetting('is_private', value === 'private');
                handleEditingChange(true);
              }}
            >
              <SelectTrigger
                aria-label="Who should be able to browse your site?"
                data-testid="site-visibility-select"
              >
                <SelectValue>
                  {getAccessOptionLabel(
                    SITE_VISIBILITY_OPTIONS,
                    effectiveIsPrivate ? 'private' : 'public',
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>{renderAccessOptions(SITE_VISIBILITY_OPTIONS)}</SelectContent>
            </Select>
          </Field>
        </div>
      </div>
      {(effectiveIsPrivate || isPrivateLocked) && (
        <div className="flex flex-col content-center items-center gap-4 md:flex-row md:items-start">
          <div className="w-full max-w-none min-w-[160px] md:w-2/3 md:max-w-[320px] md:pt-3">
            What access code should visitors use?
          </div>
          <div className="w-full md:flex-1">
            <Field
              className={isPrivateLocked ? 'relative z-10' : undefined}
              data-disabled={isPrivateLocked || undefined}
              data-invalid={Boolean(errors.password) || undefined}
            >
              <FieldLabel className="sr-only" htmlFor="site-access-code">
                Access code
              </FieldLabel>
              <InputGroup
                data-disabled={isPrivateLocked || undefined}
                data-invalid={Boolean(errors.password) || undefined}
              >
                <InputGroupInput
                  aria-invalid={Boolean(errors.password) || undefined}
                  data-testid="site-access-code"
                  disabled={isPrivateLocked}
                  id="site-access-code"
                  placeholder="Enter access code"
                  value={password || ''}
                  onChange={(e) => {
                    updateSetting('password', e.target.value);
                    handleEditingChange(true);
                  }}
                  onKeyDown={() => clearError('password')}
                />
                <InputGroupAddon align="inline-end">
                  <InputGroupButton
                    aria-label="Regenerate access code"
                    data-testid="regenerate-access-code"
                    disabled={isRegenerating}
                    size="icon-xs"
                    onClick={() => void handleRegenerateAccessCode()}
                  >
                    <RefreshCw aria-hidden={true} />
                  </InputGroupButton>
                </InputGroupAddon>
              </InputGroup>
              {errors.password && <FieldError>{errors.password}</FieldError>}
            </Field>
            {privateRssUrl && !isPrivateLocked && (
              <FieldDescription className="mt-2">
                A private RSS feed is available{' '}
                <a
                  className="text-primary"
                  href={privateRssUrl}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  here
                </a>
              </FieldDescription>
            )}
          </div>
        </div>
      )}
    </SettingGroupContent>
  );

  return (
    <TopLevelGroup
      description="Choose whether anyone can browse your site or only visitors with an access code"
      isEditing={isEditing}
      keywords={keywords}
      navid="site-access"
      saveState={saveState}
      testId="site-access"
      title="Site access"
      hideEditButton
      onCancel={handleCancel}
      onEditingChange={handleEditingChange}
      onSave={handleSave}
    >
      {form}
    </TopLevelGroup>
  );
};

export default withErrorBoundary(SiteAccess, 'Site access');
