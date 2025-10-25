import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { config } from '../wagmi'
import Connect from './Connect'

const queryClient = new QueryClient()

test('renders connect page', () => {
  render(
    <BrowserRouter>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <Connect />
        </QueryClientProvider>
      </WagmiProvider>
    </BrowserRouter>
  )
  expect(screen.getByText(/Connect Wallet/i)).toBeInTheDocument()
})