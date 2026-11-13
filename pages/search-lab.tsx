import type { GetServerSideProps } from 'next';
import type { Session } from 'next-auth';
import { SearchExperienceLab } from '../features/search-lab/SearchExperienceLab';
import { searchLabRedirect } from '../features/search-lab/access';
import { auth } from '../server/auth';

type SearchLabProps = {
  session: Session | null;
};

export const getServerSideProps: GetServerSideProps<SearchLabProps> = async (context) => {
  const session = await auth(context);
  const redirect = searchLabRedirect(
    session?.user?.role,
    process.env.NODE_ENV !== 'production',
    context.resolvedUrl,
  );
  if (redirect) {
    return {
      redirect: {
        destination: redirect,
        permanent: false,
      },
    };
  }

  return { props: { session } };
};

export default function SearchLabPage() {
  return <SearchExperienceLab />;
}
