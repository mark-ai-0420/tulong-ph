import type { SVGProps } from 'react';
import emblem from './tulongLogo.json';

/** Static local artwork shared with the offline asset generator. */
export function TulongLogo(props: SVGProps<SVGSVGElement>) {
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox={emblem.viewBox}
    aria-hidden="true" focusable="false" {...props}
    dangerouslySetInnerHTML={{ __html: emblem.artwork }} />;
}
