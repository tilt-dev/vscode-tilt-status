import { formatDistanceToNowStrict, parseISO } from 'date-fns';
import locale from 'date-fns/locale/en-US';

export default function timeago(date: Date | string | undefined | null): string {
    if (!date) {
        return "";
    }

    // Watch just does JSON deserialize, so dates come back as ISO8601 strings
    // even though the TS type _thinks_ it has a JS Date
    if (typeof date === 'string') {
        date = parseISO(date);
    }

    return formatDistanceToNowStrict(date, {
        addSuffix: true,
        locale: {
          ...locale,
          formatDistance,
      },
    });
};

// custom locale to get shorter relative times
// soure: https://github.com/date-fns/date-fns/issues/1706#issuecomment-836601089
const formatDistanceLocale: { [key: string]: string } = {
    lessThanXSeconds: '{{count}}s',
    xSeconds: '{{count}}s',
    halfAMinute: '30s',
    lessThanXMinutes: '{{count}}m',
    xMinutes: '{{count}}m',
    aboutXHours: '{{count}}h',
    xHours: '{{count}}h',
    xDays: '{{count}}d',
    aboutXWeeks: '{{count}}w',
    xWeeks: '{{count}}w',
    aboutXMonths: '{{count}}m',
    xMonths: '{{count}}m',
    aboutXYears: '{{count}}y',
    xYears: '{{count}}y',
    overXYears: '{{count}}y',
    almostXYears: '{{count}}y',
  };

  function formatDistance(token: string, count: any, options: any): string {
    options = options || {};

    const result = formatDistanceLocale[token].replace('{{count}}', count);

    if (options.addSuffix) {
      if (options.comparison > 0) {
        return 'in ' + result;
      } else {
        return result + ' ago';
      }
    }

    return result;
  }
