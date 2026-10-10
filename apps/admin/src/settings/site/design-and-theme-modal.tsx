import ChangeThemeModal from './theme-modal';
import DesignModal from './design-modal';
import React, { useEffect } from 'react';
import ThemeCodeEditorModal from './theme/theme-code-editor-modal';
import { useSettingsNavigation } from '@/settings/hooks/use-settings-navigation';
import { parseEditingThemeRoute } from './theme/theme-editor-utils';

const DesignAndThemeModal: React.FC = () => {
  const { route, updateRoute } = useSettingsNavigation();
  const currentPath = route;
  const { themeName: editingThemeName, isInvalid: hasInvalidEditingThemeRoute } =
    parseEditingThemeRoute(currentPath);

  useEffect(() => {
    if (!hasInvalidEditingThemeRoute) {
      return;
    }

    updateRoute('theme');
  }, [hasInvalidEditingThemeRoute, updateRoute]);

  if (currentPath === 'design/edit') {
    return <DesignModal />;
  } else if (currentPath === 'design/change-theme') {
    return <ChangeThemeModal />;
  } else if (currentPath === 'theme/install') {
    const url = window.location.href;
    const fragment = url.split('#')[1];
    const queryParams = fragment?.split('?')[1];
    let ref: string | null = null;
    let source: string | null = null;

    if (queryParams) {
      const searchParams = new URLSearchParams(queryParams);
      ref = searchParams.get('ref');
      source = searchParams.get('source');
    }

    return <ChangeThemeModal source={source} themeRef={ref} />;
  } else if (currentPath.startsWith('theme/edit/')) {
    if (hasInvalidEditingThemeRoute || !editingThemeName) {
      return null;
    }

    return <ThemeCodeEditorModal themeName={editingThemeName} />;
  } else {
    return null;
  }
};

export default DesignAndThemeModal;
