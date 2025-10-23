import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { ThemeProvider } from "@/components/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EveryTodo - Alarm & Task Manager",
  description: "A comprehensive alarm, todo, and calendar application with persistent notifications",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "EveryTodo",
  },
  icons: {
    icon: [
      { url: "/icon-192.svg", sizes: "192x192", type: "image/svg+xml" },
      { url: "/icon-512.svg", sizes: "512x512", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/icon-192.svg", sizes: "192x192", type: "image/svg+xml" },
    ],
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "apple-mobile-web-app-title": "EveryTodo",
    "msapplication-TileColor": "#3b82f6",
    "msapplication-config": "/browserconfig.xml",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#3b82f6",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192.svg" />
        <meta name="application-name" content="EveryTodo" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="EveryTodo" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <meta name="msapplication-TileColor" content="#3b82f6" />
        <meta name="msapplication-tap-highlight" content="no" />
        <meta name="theme-color" content="#3b82f6" />
        {process.env.NODE_ENV === 'development' && (
          <>
            <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
            <meta httpEquiv="Pragma" content="no-cache" />
            <meta httpEquiv="Expires" content="0" />
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  // Development cache clear function
                  window.clearDevCache = function() {
                    if ('caches' in window) {
                      caches.keys().then(function(cacheNames) {
                        return Promise.all(
                          cacheNames.map(function(cacheName) {
                            console.log('Manually deleting cache:', cacheName);
                            return caches.delete(cacheName);
                          })
                        );
                      }).then(function() {
                        console.log('All caches cleared!');
                        window.location.reload(true);
                      });
                    } else {
                      window.location.reload(true);
                    }
                  };
                  
                  // Add keyboard shortcut Ctrl+Shift+C to clear cache
                  document.addEventListener('keydown', function(e) {
                    if (e.ctrlKey && e.shiftKey && e.key === 'C') {
                      e.preventDefault();
                      window.clearDevCache();
                    }
                  });
                `,
              }}
            />
          </>
        )}
      </head>
              <body
                className={`${geistSans.variable} ${geistMono.variable} antialiased`}
                suppressHydrationWarning
              >
                <ThemeProvider
                  attribute="class"
                  defaultTheme="system"
                  enableSystem
                  disableTransitionOnChange
                >
                  <AuthProvider>
                    <NotificationProvider>
                      {children}
                    </NotificationProvider>
                  </AuthProvider>
                </ThemeProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                // Only register service worker in production
                if (window.location.hostname !== 'localhost') {
                  window.addEventListener('load', function() {
                    navigator.serviceWorker.register('/sw.js')
                      .then(function(registration) {
                        console.log('SW registered: ', registration);
                        
                        // Check for updates in production
                        registration.update();
                        
                        // Listen for service worker updates
                        registration.addEventListener('updatefound', function() {
                          console.log('SW update found, installing...');
                          const newWorker = registration.installing;
                          
                          if (newWorker) {
                            newWorker.addEventListener('statechange', function() {
                              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                console.log('SW update installed, showing update notification...');
                                // Don't auto-reload, let user decide
                                if (confirm('A new version is available. Reload to update?')) {
                                  window.location.reload();
                                }
                              }
                            });
                          }
                        });
                      })
                      .catch(function(registrationError) {
                        console.log('SW registration failed: ', registrationError);
                      });
                    
                    // Listen for messages from service worker
                    navigator.serviceWorker.addEventListener('message', function(event) {
                      if (event.data && event.data.type === 'SW_UPDATED') {
                        console.log('Service Worker updated, showing update notification...');
                        // Don't auto-reload, let user decide
                        if (confirm('A new version is available. Reload to update?')) {
                          window.location.reload();
                        }
                      }
                    });
                    
                    // Handle service worker controller change
                    navigator.serviceWorker.addEventListener('controllerchange', function() {
                      console.log('Service Worker controller changed');
                      window.location.reload();
                    });
                  });
                } else {
                  // In development, unregister any existing service workers and clear caches
                  navigator.serviceWorker.getRegistrations().then(function(registrations) {
                    for(let registration of registrations) {
                      console.log('Unregistering SW in development mode:', registration);
                      registration.unregister();
                    }
                  });
                  
                  // Clear all caches in development
                  if ('caches' in window) {
                    caches.keys().then(function(cacheNames) {
                      return Promise.all(
                        cacheNames.map(function(cacheName) {
                          console.log('Deleting cache in development:', cacheName);
                          return caches.delete(cacheName);
                        })
                      );
                    });
                  }
                  
                  // Add aggressive cache busting for development
                  const timestamp = Date.now();
                  const url = new URL(window.location);
                  url.searchParams.set('v', timestamp.toString());
                  url.searchParams.set('dev', 'true');
                  url.searchParams.set('nocache', Math.random().toString(36).substring(7));
                  window.history.replaceState({}, '', url);
                  
                  // Force reload with cache busting
                  if (window.location.search.indexOf('force_reload') === -1) {
                    const newUrl = new URL(window.location);
                    newUrl.searchParams.set('force_reload', '1');
                    window.location.href = newUrl.toString();
                  }
                }
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
