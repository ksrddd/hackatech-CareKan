import { Outlet } from 'react-router-dom';
import { CitizenHeader } from './CitizenHeader';
import { GovBar } from './GovBar';
import { GovFooter } from './GovFooter';
import { SkipLink } from './SkipLink';

export function CitizenLayout() {
  return (
    <>
      <SkipLink />
      <GovBar variant="citizen" />
      <CitizenHeader />
      <main id="main">
        <Outlet />
      </main>
      <GovFooter variant="citizen" />
    </>
  );
}
