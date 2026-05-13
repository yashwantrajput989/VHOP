import { MOCK_EVENTS } from './mockData';

const getLocalStorage = (key: string, fallback: any) => {
  const data = localStorage.getItem(key);
  if (!data) return fallback;
  try {
    return JSON.parse(data);
  } catch (e) {
    return fallback;
  }
};

export const mockDb = {
  from: (table: string) => {
    const builder: any = {
      currentData: null,
      select: (_fields?: any) => builder,
      eq: (field: string, value: any) => {
        const allData = getLocalStorage(`vhop_mock_${table}`, table === 'events' ? MOCK_EVENTS : []);
        builder.currentData = allData.filter((item: any) => item[field] === value);
        return builder;
      },
      ilike: (_field?: any, _value?: any) => builder,
      order: (_field?: any, _options?: any) => builder,
      single: async () => {
        const allData = builder.currentData || getLocalStorage(`vhop_mock_${table}`, []);
        return { data: allData[0] || null, error: null };
      },
      insert: async (data: any[]) => {
        const storageKey = `vhop_mock_${table}`;
        const current = getLocalStorage(storageKey, table === 'events' ? MOCK_EVENTS : []);
        const updated = [...current, ...data];
        localStorage.setItem(storageKey, JSON.stringify(updated));
        return { data: data[0], error: null };
      },
      update: (_data: any) => builder,
      delete: () => builder,
      then: (resolve: any) => {
        const data = builder.currentData || getLocalStorage(`vhop_mock_${table}`, table === 'events' ? MOCK_EVENTS : []);
        resolve({ data: data || [], error: null });
      }
    };
    return builder;
  },
  storage: {
    from: (_bucket?: any) => ({
      upload: async (_path?: any, _file?: any) => ({ data: { path: '' }, error: null }),
      getPublicUrl: (_path?: any) => ({ data: { publicUrl: 'https://images.unsplash.com/photo-1514525253361-bee8718a74a2?q=80&w=1000&auto=format&fit=crop' } })
    })
  }
};
