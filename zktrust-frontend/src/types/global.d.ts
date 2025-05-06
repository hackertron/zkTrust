interface Window {
  ethereum?: {
    isMetaMask?: boolean;
    request: (request: { method: string; params?: Array<any> }) => Promise<any>;
    on: (eventName: string, listener: (...args: any[]) => void) => void;
    removeListener: (eventName: string, listener: (...args: any[]) => void) => void;
  };
}
