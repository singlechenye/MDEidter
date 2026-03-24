import '@testing-library/jest-dom'

// Mock window.electronAPI
const mockElectronAPI = {
  readFile: vi.fn(),
  writeFile: vi.fn(),
  showOpenDialog: vi.fn(),
  showSaveDialog: vi.fn(),
  windowMinimize: vi.fn(),
  windowMaximize: vi.fn(),
  windowClose: vi.fn(),
  windowIsMaximized: vi.fn(),
}

Object.defineProperty(window, 'electronAPI', {
  value: mockElectronAPI,
  writable: true,
})

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

// Mock confirm
window.confirm = vi.fn(() => true)

// Mock alert
window.alert = vi.fn()

// Mock URL.createObjectURL and URL.revokeObjectURL
global.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
global.URL.revokeObjectURL = vi.fn()

// Reset mocks between tests
beforeEach(() => {
  vi.clearAllMocks()
  localStorageMock.getItem.mockReturnValue(null)
})