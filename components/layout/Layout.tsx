import Header from './Header'
import Footer from './Footer'

type Props = {
  children: React.ReactNode
}
const Layout: React.FC<Props> = (props) => (
  <div className="min-h-screen flex flex-col bg-[linear-gradient(to_bottom,#0284c7_0%,#38bdf8_55%,#2bc9fb_100%)]">
    <Header />
    <div className="layout flex-1">{props.children}</div>
    <Footer />
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
        padding: 0 2rem;
      }
    `}</style>
  </div>
)

export default Layout
