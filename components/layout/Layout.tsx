import Header from './Header'
import Footer from './Footer'

type Props = {
  children: React.ReactNode
}
const Layout: React.FC<Props> = (props) => (
  <div className="flex min-h-screen flex-col">
    <Header />
    <div className="layout flex-1">{props.children}</div>
    <Footer />
    <a
      href="https://wa.me/523313353452?text=Hola%2C%20me%20gustar%C3%ADa%20recibir%20informaci%C3%B3n%20sobre%20sus%20viajes."
      target="_blank"
      rel="noreferrer"
      aria-label="Escríbenos por WhatsApp"
      className="whatsapp-fab fixed right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-emerald-950/25 transition-colors hover:bg-[#1fb95a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 motion-reduce:transition-none sm:right-5 sm:h-14 sm:w-14"
    >
      <svg viewBox="0 0 32 32" aria-hidden="true" className="h-7 w-7 fill-current">
        <path d="M16.04 3C8.86 3 3.02 8.82 3.02 15.98c0 2.28.6 4.5 1.74 6.46L3 29l6.75-1.73a13.1 13.1 0 0 0 6.28 1.6h.01c7.18 0 13.02-5.82 13.03-12.98A12.9 12.9 0 0 0 25.25 6.7 12.93 12.93 0 0 0 16.04 3Zm0 23.67h-.01c-1.93 0-3.82-.52-5.47-1.5l-.39-.23-4 .99 1.07-3.87-.25-.4a10.7 10.7 0 0 1-1.64-5.68c0-5.9 4.8-10.69 10.7-10.69 2.85 0 5.53 1.11 7.55 3.13a10.62 10.62 0 0 1 3.13 7.55c0 5.9-4.8 10.7-10.69 10.7Zm5.87-8.01c-.32-.16-1.9-.94-2.2-1.05-.3-.1-.51-.16-.73.16-.21.32-.83 1.05-1.02 1.27-.19.21-.38.24-.7.08-.32-.16-1.36-.5-2.6-1.59-.96-.85-1.61-1.9-1.8-2.22-.19-.32-.02-.49.14-.65.14-.14.32-.38.48-.57.16-.19.21-.32.32-.54.1-.22.05-.4-.03-.57-.08-.16-.73-1.75-1-2.4-.26-.63-.53-.54-.73-.55h-.62c-.21 0-.56.08-.86.4-.3.32-1.13 1.1-1.13 2.67s1.16 3.1 1.32 3.32c.16.21 2.28 3.47 5.52 4.87.77.33 1.37.53 1.84.68.77.24 1.47.21 2.02.13.62-.09 1.9-.78 2.17-1.54.27-.75.27-1.4.19-1.54-.08-.14-.3-.22-.62-.38Z" />
      </svg>
    </a>
    <style jsx global>{`
      html {
        box-sizing: border-box;
      }

      *,
      *:before,
      *:after {
        box-sizing: inherit;
      }

      body {
        margin: 0;
        padding: 0;
        font-size: 16px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
          Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji',
          'Segoe UI Symbol';
      }

      input,
      textarea {
        font-size: 16px;
      }

      button {
        cursor: pointer;
      }
    `}</style>
    <style jsx>{`
      .layout {
        width: 100%;
      }
    `}</style>
  </div>
)

export default Layout
