/**
 * Mock for next/navigation used in Storybook (react-webpack5).
 * usePathname defaults to '/' — individual stories can override via beforeEach.
 */
import { fn } from '@storybook/test'

export const usePathname = fn().mockReturnValue('/')
export const useRouter = fn().mockReturnValue({})
export const useSearchParams = fn().mockReturnValue(new URLSearchParams())
