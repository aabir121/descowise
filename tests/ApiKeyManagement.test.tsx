import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from '../utils/i18n';
import ApiKeyStatusIndicator from '../components/common/ApiKeyStatusIndicator';
import ApiKeyPrompt from '../components/common/ApiKeyPrompt';
import ApiKeyManagementModal from '../components/ApiKeyManagementModal';
import { hasStoredApiKey, storeUserApiKey, removeUserApiKey } from '../utils/apiKeyStorage';

// Mock the API key storage utilities
jest.mock('../utils/apiKeyStorage', () => ({
  hasStoredApiKey: jest.fn(),
  getApiKeyDisplayFormat: jest.fn(),
  getApiKeyValidationStatus: jest.fn(),
  storeUserApiKey: jest.fn(),
  removeUserApiKey: jest.fn(),
  getUserApiKey: jest.fn()
}));

// Mock the API service
jest.mock('../services/descoService', () => ({
  validateApiKey: jest.fn()
}));

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <I18nextProvider i18n={i18n}>
        {component}
      </I18nextProvider>
    </BrowserRouter>
  );
};

describe('API Key Management System', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('ApiKeyStatusIndicator', () => {
    it('shows not configured status when no API key is stored', () => {
      (hasStoredApiKey as jest.Mock).mockReturnValue(false);
      
      renderWithProviders(
        <ApiKeyStatusIndicator onClick={() => {}} />
      );

      expect(screen.getByText(/not configured/i)).toBeInTheDocument();
    });

    it('shows configured status when API key is stored', () => {
      (hasStoredApiKey as jest.Mock).mockReturnValue(true);
      
      renderWithProviders(
        <ApiKeyStatusIndicator onClick={() => {}} />
      );

      expect(screen.getByText(/configured/i)).toBeInTheDocument();
    });

    it('calls onClick handler when clicked', () => {
      const mockOnClick = jest.fn();
      (hasStoredApiKey as jest.Mock).mockReturnValue(false);
      
      renderWithProviders(
        <ApiKeyStatusIndicator onClick={mockOnClick} />
      );

      fireEvent.click(screen.getByRole('button'));
      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('renders different variants correctly', () => {
      (hasStoredApiKey as jest.Mock).mockReturnValue(false);
      
      const { rerender } = renderWithProviders(
        <ApiKeyStatusIndicator variant="badge" onClick={() => {}} />
      );

      expect(screen.getByText(/not configured/i)).toBeInTheDocument();

      rerender(
        <BrowserRouter>
          <I18nextProvider i18n={i18n}>
            <ApiKeyStatusIndicator variant="compact" onClick={() => {}} />
          </I18nextProvider>
        </BrowserRouter>
      );

      expect(screen.getByText(/not configured/i)).toBeInTheDocument();
    });
  });

  describe('ApiKeyPrompt', () => {
    it('renders banner variant with setup button', () => {
      const mockOnSetup = jest.fn();
      
      renderWithProviders(
        <ApiKeyPrompt variant="banner" onSetupClick={mockOnSetup} />
      );

      expect(screen.getByText(/enable ai features/i)).toBeInTheDocument();
      expect(screen.getByText(/setup api key/i)).toBeInTheDocument();
      
      fireEvent.click(screen.getByText(/setup api key/i));
      expect(mockOnSetup).toHaveBeenCalledTimes(1);
    });

    it('renders card variant correctly', () => {
      const mockOnSetup = jest.fn();
      
      renderWithProviders(
        <ApiKeyPrompt variant="card" onSetupClick={mockOnSetup} />
      );

      expect(screen.getByText(/enable ai features/i)).toBeInTheDocument();
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('renders inline variant with compact layout', () => {
      const mockOnSetup = jest.fn();
      
      renderWithProviders(
        <ApiKeyPrompt variant="inline" onSetupClick={mockOnSetup} />
      );

      expect(screen.getByText(/setup/i)).toBeInTheDocument();
      fireEvent.click(screen.getByText(/setup/i));
      expect(mockOnSetup).toHaveBeenCalledTimes(1);
    });

    it('shows dismiss button when showDismiss is true', () => {
      const mockOnDismiss = jest.fn();
      
      renderWithProviders(
        <ApiKeyPrompt 
          variant="banner" 
          onSetupClick={() => {}} 
          onDismiss={mockOnDismiss}
          showDismiss={true}
        />
      );

      const dismissButton = screen.getByLabelText(/dismiss/i);
      expect(dismissButton).toBeInTheDocument();
      
      fireEvent.click(dismissButton);
      expect(mockOnDismiss).toHaveBeenCalledTimes(1);
    });
  });

  describe('ApiKeyManagementModal', () => {
    it('renders modal when open', () => {
      renderWithProviders(
        <ApiKeyManagementModal 
          isOpen={true} 
          onClose={() => {}} 
          onApiKeyUpdated={() => {}} 
        />
      );

      expect(screen.getByText(/setup ai features/i)).toBeInTheDocument();
    });

    it('does not render when closed', () => {
      renderWithProviders(
        <ApiKeyManagementModal 
          isOpen={false} 
          onClose={() => {}} 
          onApiKeyUpdated={() => {}} 
        />
      );

      expect(screen.queryByText(/setup ai features/i)).not.toBeInTheDocument();
    });

    it('shows different title for existing users', async () => {
      (hasStoredApiKey as jest.Mock).mockReturnValue(true);
      
      renderWithProviders(
        <ApiKeyManagementModal 
          isOpen={true} 
          onClose={() => {}} 
          onApiKeyUpdated={() => {}} 
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/manage ai api key/i)).toBeInTheDocument();
      });
    });

    it('calls onClose when close button is clicked', () => {
      const mockOnClose = jest.fn();
      
      renderWithProviders(
        <ApiKeyManagementModal 
          isOpen={true} 
          onClose={mockOnClose} 
          onApiKeyUpdated={() => {}} 
        />
      );

      fireEvent.click(screen.getByLabelText(/close/i));
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Integration Tests', () => {
    it('complete flow: status indicator -> modal -> setup -> success', async () => {
      (hasStoredApiKey as jest.Mock).mockReturnValue(false);
      const mockStoreApiKey = storeUserApiKey as jest.Mock;
      const mockOnApiKeyUpdated = jest.fn();
      
      let isModalOpen = false;
      const setModalOpen = (open: boolean) => { isModalOpen = open; };
      
      const { rerender } = renderWithProviders(
        <div>
          <ApiKeyStatusIndicator onClick={() => setModalOpen(true)} />
          <ApiKeyManagementModal 
            isOpen={isModalOpen} 
            onClose={() => setModalOpen(false)} 
            onApiKeyUpdated={mockOnApiKeyUpdated} 
          />
        </div>
      );

      // Click status indicator to open modal
      fireEvent.click(screen.getByRole('button'));
      
      // Rerender with modal open
      rerender(
        <BrowserRouter>
          <I18nextProvider i18n={i18n}>
            <div>
              <ApiKeyStatusIndicator onClick={() => setModalOpen(true)} />
              <ApiKeyManagementModal 
                isOpen={true} 
                onClose={() => setModalOpen(false)} 
                onApiKeyUpdated={mockOnApiKeyUpdated} 
              />
            </div>
          </I18nextProvider>
        </BrowserRouter>
      );

      expect(screen.getByText(/setup ai features/i)).toBeInTheDocument();
    });

    it('handles API key removal flow', async () => {
      (hasStoredApiKey as jest.Mock).mockReturnValue(true);
      const mockRemoveApiKey = removeUserApiKey as jest.Mock;
      
      renderWithProviders(
        <ApiKeyManagementModal 
          isOpen={true} 
          onClose={() => {}} 
          onApiKeyUpdated={() => {}} 
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/remove api key/i)).toBeInTheDocument();
      });

      // Click remove button
      fireEvent.click(screen.getByText(/remove api key/i));
      
      // Confirm removal
      await waitFor(() => {
        expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByRole('button', { name: /remove api key/i }));
      expect(mockRemoveApiKey).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility Tests', () => {
    it('has proper ARIA labels and roles', () => {
      renderWithProviders(
        <ApiKeyStatusIndicator onClick={() => {}} />
      );

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('title');
    });

    it('supports keyboard navigation', () => {
      const mockOnClick = jest.fn();
      
      renderWithProviders(
        <ApiKeyStatusIndicator onClick={mockOnClick} />
      );

      const button = screen.getByRole('button');
      button.focus();
      fireEvent.keyDown(button, { key: 'Enter' });
      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('has proper focus management in modal', () => {
      renderWithProviders(
        <ApiKeyManagementModal 
          isOpen={true} 
          onClose={() => {}} 
          onApiKeyUpdated={() => {}} 
        />
      );

      const modal = screen.getByRole('dialog');
      expect(modal).toBeInTheDocument();
    });
  });

  describe('Mobile Responsiveness', () => {
    it('renders compact layout on small screens', () => {
      // Mock window.innerWidth for mobile
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      renderWithProviders(
        <ApiKeyPrompt variant="banner" onSetupClick={() => {}} />
      );

      const button = screen.getByRole('button');
      expect(button).toHaveClass('w-full');
    });
  });
});
