import { CollectionProvider } from './contexts/CollectionContext';
import { EnvironmentProvider } from './contexts/EnvironmentContext';
import { AuthProvider } from './components/Auth/AuthManager';
import { ConsoleProvider } from './contexts/ConsoleContext';
import { ResponsePopupProvider } from './contexts/ResponsePopupContext';
import { TestProvider } from './contexts/TestContext';
import Layout from './components/common/Layout';

function App() {
  return (
    <AuthProvider>
      <ConsoleProvider>
        <CollectionProvider>
          <EnvironmentProvider>
            <TestProvider>
              <ResponsePopupProvider>
                <Layout />
              </ResponsePopupProvider>
            </TestProvider>
          </EnvironmentProvider>
        </CollectionProvider>
      </ConsoleProvider>
    </AuthProvider>
  );
}

export default App;
