import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

type SiteVersionRow = {
  id: string;
  version: string;
  start: string;
  end?: string | null;
};

function formatIsoToBr(iso: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso));
  if (!match) return iso;
  const [, y, m, d] = match;
  return `${d}/${m}/${y}`;
}

function getSearchExcludeRoutesForOldVersions() {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const data = require('./src/data/siteVersions.json') as {
    history: SiteVersionRow[];
  };
  const history = Array.isArray(data.history) ? data.history : [];
  return history.map((row) => `docs/${row.id}/**`);
}

function getDocsVersionsConfig() {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const data = require('./src/data/siteVersions.json') as {
    current: SiteVersionRow;
    history: SiteVersionRow[];
  };

  const versions: Record<string, {label: string}> = {
    current: {label: data.current.version},
  };

  for (const row of data.history ?? []) {
    versions[row.id] = {
      label: row.end ? `${row.version} (até ${formatIsoToBr(row.end)})` : row.version,
    };
  }

  return versions;
}

const config: Config = {
  title: 'Quadro de Horários do IFPI - Campus São Raimundo Nonato',
  tagline:
    '"Com organização e tempo, acha-se o segredo de fazer tudo e bem feito." - Pitágoras',
  favicon: 'img/favicon.gif',

  url: 'https://profsergiocastro.github.io/',
  baseUrl: '/ifpisrn-horarios/',

  organizationName: 'profsergiocastro',
  projectName: 'ifpisrn-horarios',
  trailingSlash: false,

  onBrokenLinks: 'warn',
  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },

  i18n: {
    defaultLocale: 'pt-BR',
    locales: ['pt-BR'],
    path: 'i18n',
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          lastVersion: 'current',
          versions: getDocsVersionsConfig(),
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/favicon.gif',
    navbar: {
      logo: {
        alt: 'IFPI - Campus São Raimundo Nonato',
        src: 'img/logo.svg',
        srcDark: 'img/logoDark.svg',
      },
      items: [
        {
          type: 'doc',
          docId: 'intro',
          position: 'left',
          label: 'Quadro de Horários',
        },
        {
          type: 'docsVersionDropdown',
          position: 'left',
        },
        {
          type: 'dropdown',
          position: 'left',
          label: 'Informações do Campus',
          className: 'campusInfoNavbarDropdown',
          items: [
            {
              type: 'doc',
              docId: 'campus/administracao',
              label: 'Administração',
            },
            {
              type: 'doc',
              docId: 'campus/setor-de-saude',
              label: 'Setor de Saúde',
            },
            {
              type: 'doc',
              docId: 'campus/calendario-academico',
              label: 'Calendário Acadêmico',
            },
            {
              type: 'html',
              value: '<div class="sidebarSectionHeading">CURSOS TÉCNICOS</div>',
            },
            {
              type: 'doc',
              docId: 'cursos/tecnico-administracao-integrado',
              label: 'Administração (Integrado)',
            },
            {
              type: 'doc',
              docId: 'cursos/tecnico-eventos-integrado',
              label: 'Eventos (Integrado)',
            },
            {
              type: 'doc',
              docId: 'cursos/tecnico-informatica-integrado',
              label: 'Informática (Integrado)',
            },
            {
              type: 'doc',
              docId: 'cursos/tecnico-administracao-subsequente',
              label: 'Administração (Subsequente)',
            },
            {
              type: 'doc',
              docId: 'cursos/tecnico-gastronomia-subsequente',
              label: 'Gastronomia (Subsequente)',
            },
            {
              type: 'doc',
              docId: 'cursos/tecnico-guia-de-turismo-subsequente',
              label: 'Guia de Turismo (Subsequente)',
            },
            {
              type: 'doc',
              docId: 'cursos/tecnico-servico-de-restaurante-e-bar',
              label: 'Serviço de Restaurante e Bar (Subsequente)',
            },
            {
              type: 'doc',
              docId: 'cursos/tecnico-gastronomia-proeja',
              label: 'Gastronomia (PROEJA)',
            },
            {
              type: 'html',
              value: '<div class="sidebarSectionHeading">LICENCIATURA</div>',
            },
            {
              type: 'doc',
              docId: 'cursos/licenciatura-fisica',
              label: 'Licenciatura em Física',
            },
            {
              type: 'doc',
              docId: 'cursos/licenciatura-matematica',
              label: 'Licenciatura em Matemática',
            },
            {
              type: 'html',
              value: '<div class="sidebarSectionHeading">TECNOLOGIA</div>',
            },
            {
              type: 'doc',
              docId: 'cursos/tecnologia-gastronomia',
              label: 'Gastronomia',
            },
            {
              type: 'doc',
              docId: 'cursos/tecnologia-sistemas-para-internet',
              label: 'Sistemas para Internet',
            },
            {
              type: 'html',
              value: '<div class="sidebarSectionHeading">CONTATO</div>',
            },
            {
              type: 'html',
              value:
                '<div class="campusInfoSubItem campusInfoSubItem--telefone"><span class="campusInfoSubItem__label">Telefone</span><span class="campusInfoSubItem__value">(89) 2221-9904</span></div>',
            },
            {
              type: 'html',
              value:
                '<div class="campusInfoSubItem campusInfoSubItem--endereco"><span class="campusInfoSubItem__label">Endereço</span><span class="campusInfoSubItem__value">BR 020, S/N, Bairro Primavera, São Raimundo Nonato - PI, CEP 64770-000</span></div>',
            },
          ],
        },
        {
          type: 'search',
          position: 'right',
        },
      ],
    },
    docs: {
      sidebar: {
        hideable: true,
        autoCollapseCategories: true,
      },
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Institucional',
          items: [
            {
              label: 'IFPI - Campus São Raimundo Nonato',
              href: 'https://www.ifpi.edu.br/saoraimundononato',
            },
          ],
        },
        {
          title: 'Contato',
          items: [
            {
              label: 'sergio.castro@ifpi.edu.br',
              href: 'mailto:sergio.castro@ifpi.edu.br',
            },
          ],
        },
      ],
      copyright: `Copyright © 2026 Prof. Sérgio Castro e Prof. Von Mecheln.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,

  plugins: [
    [
      '@docusaurus/plugin-google-gtag',
      {
        trackingID: 'G-P5VW49XG7M',
        anonymizeIP: true,
      },
    ],
    [
      '@docusaurus/plugin-google-tag-manager',
      {
        containerId: 'GTM-MQ8B67G4',
      },
    ],
    [
      require.resolve('docusaurus-lunr-search'),
      {
        languages: ['pt'],
        // Search should point to the current timetable by default.
        // Older timetable versions remain accessible via the Versions dropdown.
        excludeRoutes: getSearchExcludeRoutesForOldVersions(),
      },
    ],
  ],
};

export default config;
