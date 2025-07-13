type BalanceWarningListener = (isOpen: boolean) => void;

class BalanceWarningService {
  private listeners: BalanceWarningListener[] = [];
  private isOpen = false;

  subscribe(listener: BalanceWarningListener) {
    this.listeners.push(listener);
    // Immediately call with current state
    listener(this.isOpen);
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  open() {
    this.isOpen = true;
    this.notifyListeners();
  }

  close() {
    this.isOpen = false;
    this.notifyListeners();
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.isOpen));
  }
}

// Export singleton instance
export const balanceWarningService = new BalanceWarningService(); 