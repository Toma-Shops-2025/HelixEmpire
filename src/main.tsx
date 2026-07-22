import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider, createRouter, createHashHistory } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'
import './index.css'

const hashHistory = createHashHistory()
const router = createRouter({
  routeTree,
  history: hashHistory
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

const rootElement = document.getElementById('root')!;
if (!rootElement.innerHTML) {
  try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <RouterProvider router={router} />
      </React.StrictMode>,
    )
  } catch (e) {
    console.error("React: Mount failed", e);
    rootElement.innerHTML = `<div style="color:white;text-align:center;padding:50px;"><h2>Critical Load Error</h2><p>Please refresh the page.</p></div>`;
  }
}
