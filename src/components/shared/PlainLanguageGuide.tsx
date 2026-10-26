import type { Language } from '@/lib/i18n';

type Pillar = 'medical' | 'education' | 'worker';

interface GuideCopy {
  destination: string;
  papers: string[];
  script: string;
}

const copy: Record<Language, {
  quickStart: string;
  glossary: string;
  actions: [string, string, string];
  optional: string;
  guides: Record<Pillar, GuideCopy>;
  glossaryTerms: Record<Pillar, [string, string][]>;
}> = {
  taglish: {
    quickStart: 'Unang Gagawin Ngayong Araw: 1-2-3 Quick Guide',
    glossary: 'Ano ang ibig sabihin ng mga salitang ito? (Simpleng Paliwanag)',
    actions: ['Saan Unang Pupunta', 'Anong Mga Papel ang Dapat Hawak', 'Ano ang Sasabihin sa Counter'],
    optional: 'Buksan ang simpleng paliwanag',
    guides: {
      medical: {
        destination: 'Pumunta sa Medical Social Service desk',
        papers: ['Pinakabagong running bill o Statement of Account (SOA)', 'Clinical Abstract o medical summary na pirmado ng doktor', 'PhilHealth record at valid ID ng pasyente o kinatawan'],
        script: '“Magpapatulong po kami sa bayarin. Saan po kami magpapasa ng bill at medical summary para sa assessment?”',
      },
      education: {
        destination: 'Pumunta sa registrar o scholarship desk ng paaralan',
        papers: ['School ID o proof of enrollment', 'Pinakabagong grades o report card', 'Patunay ng kita o barangay indigency kung hinihingi'],
        script: '“Mag-aaral po ako at nais kong malaman kung anong tuition help o scholarship ang bukas para sa school at course ko.”',
      },
      worker: {
        destination: 'Magsimula sa SSS o Pag-IBIG branch, o sa opisyal na member portal para sa napili mong loan o claim',
        papers: ['Valid ID at SSS o Pag-IBIG number', 'Contribution record o payslip', 'Medical certificate, employer record, o loan disclosure ayon sa iyong sitwasyon'],
        script: '“Gusto ko pong ipa-check ang hulog ko at malaman kung anong claim o loan ang maaari kong ihanda.”',
      },
    },
    glossaryTerms: {
      medical: [
        ['Running Bill / SOA', 'Listahan ng singil sa ospital habang naka-admit o ang pinal na statement bago umuwi.'],
        ['Clinical Abstract', 'Maikling buod ng sakit, gamutan, at plano na ginagawa at pinipirmahan ng doktor.'],
        ['Guarantee Letter / GL', 'Liham ng ahensiya na nagsasabing magbibigay ito ng tulong sa ospital kapag naaprubahan.'],
        ['No Balance Billing / NBB', 'Patakarang maaaring sumaklaw sa bayarin ng kwalipikadong pasyente. Itanong sa Malasakit o social service desk kung sakop ang inyong kaso.'],
        ['Barangay Indigency', 'Sertipiko mula sa barangay tungkol sa kalagayan ng pamilya; itanong kung kailangan ito.'],
      ],
      education: [
        ['SUC / LUC', 'Pampublikong state university o lokal na pamantasan/kolehiyo.'],
        ['TES / TDP', 'Mga programang nagbibigay ng tulong-paaral o allowance sa ilang kwalipikadong college student.'],
        ['Barangay Indigency', 'Sertipiko mula sa barangay tungkol sa kalagayan ng pamilya; maaaring hingin sa aplikasyon.'],
        ['4Ps / Listahanan', 'Mga talaan ng programang panlipunan at pamilyang tinukoy para sa suporta.'],
      ],
      worker: [
        ['DOLE SEnA', 'Libreng unang pag-uusap na pinapamagitan ng DOLE para subukang ayusin ang alitan sa trabaho.'],
        ['SSS MSC', 'Salary bracket na ginagamit ng SSS sa ilang kuwenta; maaaring iba ito sa aktuwal na sahod.'],
        ['ECC', 'Employees’ Compensation: benepisyo para sa kwalipikadong sakit o pinsalang may kaugnayan sa trabaho.'],
        ['Contingency semester', 'Panahong ginagamit ng SSS bilang batayan bago ang panganganak, sakit, o ibang claim.'],
        ['Authorized cause', 'Dahilan ng pagtanggal na kinikilala sa batas, gaya ng pagsasara o pagtitipid ng kumpanya.'],
      ],
    },
  },
  cebuano: {
    quickStart: 'Unang Buhaton Karong Adlawa: 1-2-3 nga Giya',
    glossary: 'Unsa ang kahulogan niining mga pulonga? (Yano nga Pasabot)',
    actions: ['Asa Una Moadto', 'Mga Papeles nga Dad-on', 'Unsa ang Isulti sa Opisina'],
    optional: 'Ablihi ang yano nga mga pasabot',
    guides: {
      medical: {
        destination: 'Adto sa Medical Social Service desk',
        papers: ['Pinakabag-ong running bill o Statement of Account (SOA)', 'Clinical Abstract o medical summary nga gipirmahan sa doktor', 'Rekord sa PhilHealth ug balidong ID sa pasyente o representante'],
        script: '“Mangayo unta kami og tabang sa bayranan. Asa namo ipasa ang bill ug medical summary aron masusi?”',
      },
      education: {
        destination: 'Adto sa registrar o scholarship desk sa eskwelahan',
        papers: ['School ID o pamatuod nga naka-enroll', 'Pinakabag-ong grado o report card', 'Pamatuod sa kita o barangay indigency kon pangayoon'],
        script: '“Mopadayon ko sa pag-eskwela. Unsang tuition help o scholarship ang abli para sa akong eskwelahan ug kurso?”',
      },
      worker: {
        destination: 'Sugdi sa SSS o Pag-IBIG branch, o opisyal nga member portal para sa imong loan o claim',
        papers: ['Balidong ID ug SSS o Pag-IBIG number', 'Rekord sa hulog o payslip', 'Medical certificate, rekord sa employer, o loan disclosure sumala sa sitwasyon'],
        script: '“Palihog susiha ang akong mga hulog ug unsang claim o loan ang akong maandam.”',
      },
    },
    glossaryTerms: {
      medical: [
        ['Running Bill / SOA', 'Lista sa bayranan samtang na-admit o ang katapusang statement sa dili pa mouli.'],
        ['Clinical Abstract', 'Mubo nga summary sa sakit, tambal, ug plano sa doktor nga gipirmahan niya.'],
        ['Guarantee Letter / GL', 'Sulat nga nagpamatuod nga motabang ang ahensiya sa ospital kon maaprobahan.'],
        ['No Balance Billing / NBB', 'Lagda nga mahimong motabon sa bayranan sa kwalipikadong pasyente. Pangutana sa Malasakit o social service desk kon sakop ang inyong kaso.'],
        ['Barangay Indigency', 'Sertipiko gikan sa barangay bahin sa kahimtang sa pamilya; pangutana kon gikinahanglan.'],
      ],
      education: [
        ['SUC / LUC', 'State university o lokal nga pampublikong unibersidad o kolehiyo.'],
        ['TES / TDP', 'Mga programa nga naghatag og tabang sa tuition o allowance sa pipila ka kwalipikadong college student.'],
        ['Barangay Indigency', 'Sertipiko gikan sa barangay bahin sa kahimtang sa pamilya; usahay pangayoon sa aplikasyon.'],
        ['4Ps / Listahanan', 'Mga talaan sa programa sa sosyal nga tabang ug mga pamilyang giila nga nanginahanglan og suporta.'],
      ],
      worker: [
        ['DOLE SEnA', 'Libre nga unang pakig-istorya nga tabangan sa DOLE aron sulayan og husay ang problema sa trabaho.'],
        ['SSS MSC', 'Salary bracket nga gamiton sa SSS sa pipila ka kuwenta; mahimong lahi sa tinuod nga sweldo.'],
        ['ECC', 'Employees’ Compensation: benepisyo para sa kwalipikadong sakit o kadaot nga may kalabotan sa trabaho.'],
        ['Contingency semester', 'Panahon nga gigamit sa SSS isip basihan sa dili pa ang pagpanganak, sakit, o laing claim.'],
        ['Authorized cause', 'Rason sa pagtangtang nga gitugot sa balaod, sama sa pagsira o pagmenos sa gasto sa kompanya.'],
      ],
    },
  },
  ilocano: {
    quickStart: 'Umuna a Aramiden Ita nga Aldaw: 1-2-3 a Giya',
    glossary: 'Ania ti kaipapanan dagitoy a balikas? (Nalaka a Pannakailawlawag)',
    actions: ['Sadino ti Umuna a Papanan', 'Dagiti Papel a Dalusen', 'Ania ti Ibagam iti Opisina'],
    optional: 'Luktan dagiti nalaka a pannakailawlawag',
    guides: {
      medical: {
        destination: 'Mapan iti Medical Social Service desk',
        papers: ['Kaudian a running bill wenno Statement of Account (SOA)', 'Clinical Abstract wenno medical summary a pinirmaan ti doktor', 'Rekord ti PhilHealth ken umiso nga ID ti pasyente wenno representante'],
        script: '“Agkiddawkami koma iti tulong para iti bayadan. Sadino ti pagipatulod ti bill ken medical summary tapno maamiris?”',
      },
      education: {
        destination: 'Mapan iti registrar wenno scholarship desk ti eskuelaan',
        papers: ['School ID wenno pammaneknek a naka-enroll', 'Kaudian a grado wenno report card', 'Pammaneknek ti kita wenno barangay indigency no kiddawen'],
        script: '“Agadalak pay. Ania a tuition help wenno scholarship ti silulukat para iti eskuelaan ken kurso ko?”',
      },
      worker: {
        destination: 'Rugian iti SSS wenno Pag-IBIG branch, wenno opisial a member portal para iti loan wenno claimmo',
        papers: ['Umiso nga ID ken numero ti SSS wenno Pag-IBIG', 'Rekord ti kontribusion wenno payslip', 'Medical certificate, rekord ti employer, wenno loan disclosure sigun iti kasasaadmo'],
        script: '“Pangngaasi a kitaen dagiti kontribusionko ken ibagam no ania a claim wenno loan ti mabalin ko a maisagana.”',
      },
    },
    glossaryTerms: {
      medical: [
        ['Running Bill / SOA', 'Listaan dagiti singir bayat nga adda iti ospital wenno maudi a statement sakbay ti panagawid.'],
        ['Clinical Abstract', 'Ababa a pakabuklan ti sakit, panagagas, ken plano a pinirmaan ti doktor.'],
        ['Guarantee Letter / GL', 'Surat a mangibaga a tumulong ti ahensia iti ospital no maaprobaran.'],
        ['No Balance Billing / NBB', 'Pagannurotan a mabalin a mangsukat iti bayadan dagiti kualipikado a pasyente. Damagen iti Malasakit wenno social service desk no sakop ti kasom.'],
        ['Barangay Indigency', 'Sertipiko manipud iti barangay maipapan iti kasasaad ti pamilya; damagen no kasapulan.'],
      ],
      education: [
        ['SUC / LUC', 'State university wenno lokal a pampubliko a unibersidad wenno kolehio.'],
        ['TES / TDP', 'Dagiti programa a mangted iti tulong-tuition wenno allowance kadagiti sumagmamano a kualipikado a estudyante.'],
        ['Barangay Indigency', 'Sertipiko manipud iti barangay maipapan iti kasasaad ti pamilya; mabalin a kiddawen iti aplikasion.'],
        ['4Ps / Listahanan', 'Dagiti listaan ti programa para iti sosial a tulong ken dagiti pamilya a kasapulan ti suporta.'],
      ],
      worker: [
        ['DOLE SEnA', 'Libre a damo a panagsasarita a tulongan ti DOLE tapno padasen a pasayaaten ti riribuk iti trabaho.'],
        ['SSS MSC', 'Salary bracket nga usaren ti SSS iti sumagmamano a kalkulo; mabalin a naiduma iti pudno a sueldo.'],
        ['ECC', 'Employees’ Compensation: benepisio para kadagiti kualipikado a sakit wenno dakes a napasamak gapu iti trabaho.'],
        ['Contingency semester', 'Panawen nga usaren ti SSS a kas batayan sakbay ti panaganak, sakit, wenno sabali a claim.'],
        ['Authorized cause', 'Rason ti panangikkat iti trabaho a bigbigenda ti linteg, kas panagsara wenno panangpabassit ti gastos ti kompania.'],
      ],
    },
  },
  en: {
    quickStart: 'What to Do Today: 1-2-3 Quick Guide',
    glossary: 'What do these words mean? (Plain explanations)',
    actions: ['Where to Go First', 'What Papers to Bring', 'What to Say at the Desk'],
    optional: 'Open plain explanations',
    guides: {
      medical: {
        destination: 'Start at the hospital Medical Social Service desk',
        papers: ['Latest running bill or Statement of Account (SOA)', 'Doctor-signed Clinical Abstract or medical summary', 'PhilHealth record and valid ID for the patient or representative'],
        script: '“We need help with the hospital bill. Where can we submit the bill and medical summary for assessment?”',
      },
      education: {
        destination: 'Start at the school registrar or scholarship desk',
        papers: ['School ID or proof of enrollment', 'Latest grades or report card', 'Proof of income or barangay indigency if requested'],
        script: '“I plan to continue studying. Which tuition help or scholarship is open for my school and course?”',
      },
      worker: {
        destination: 'Start at an SSS or Pag-IBIG branch, or the official member portal for your loan or claim',
        papers: ['Valid ID and SSS or Pag-IBIG number', 'Contribution record or payslip', 'Medical certificate, employer record, or loan disclosure for your situation'],
        script: '“Please check my contributions and tell me which claim or loan I can prepare.”',
      },
    },
    glossaryTerms: {
      medical: [
        ['Running Bill / SOA', 'A list of hospital charges during a stay, or the final statement before discharge.'],
        ['Clinical Abstract', 'A doctor-signed summary of the illness, treatment, and care plan.'],
        ['Guarantee Letter / GL', 'A letter saying an agency will help pay the hospital after it approves the request.'],
        ['No Balance Billing / NBB', 'A policy that may cover charges for eligible patients. Ask the Malasakit or social service desk whether your case qualifies.'],
        ['Barangay Indigency', 'A barangay certificate about a household’s circumstances; ask whether your application needs one.'],
      ],
      education: [
        ['SUC / LUC', 'A state university or a local public university or college.'],
        ['TES / TDP', 'Programs that provide education aid or an allowance to some eligible college students.'],
        ['Barangay Indigency', 'A barangay certificate about a household’s circumstances; an application may ask for one.'],
        ['4Ps / Listahanan', 'Social assistance program and registry records used to identify families for support.'],
      ],
      worker: [
        ['DOLE SEnA', 'A free first conversation facilitated by DOLE to try to settle a workplace concern.'],
        ['SSS MSC', 'A salary bracket SSS uses for some calculations; it may differ from actual pay.'],
        ['ECC', 'Employees’ Compensation: benefits for qualifying work-related illness or injury.'],
        ['Contingency semester', 'A period SSS uses as a reference before childbirth, illness, or another claim.'],
        ['Authorized cause', 'A legally recognized reason for ending employment, such as closure or cost reduction.'],
      ],
    },
  },
};

interface QuickStartActionCardProps {
  pillar: Pillar;
  language: Language;
  scenario?: string;
  sector?: string;
  organizationName?: string;
  isPrivateHospital?: boolean;
  hasMalasakitCenter?: boolean;
}

export function QuickStartActionCard({ pillar, language, scenario, sector, organizationName, isPrivateHospital, hasMalasakitCenter }: QuickStartActionCardProps) {
  const text = copy[language];
  const guide = text.guides[pillar];
  let destination = guide.destination;
  let papers = guide.papers;
  let script = guide.script;
  if (pillar === 'medical') {
    if (isPrivateHospital) destination = language === 'en' ? 'Start at the billing and social service desks' : language === 'cebuano' ? 'Sugdi sa billing ug social service desk' : language === 'ilocano' ? 'Rugian iti billing ken social service desk' : 'Magsimula sa billing at social service desk';
    else if (hasMalasakitCenter) destination = language === 'en' ? 'Start at the Malasakit Center desk' : language === 'cebuano' ? 'Sugdi sa Malasakit Center desk' : language === 'ilocano' ? 'Rugian iti Malasakit Center desk' : 'Magsimula sa Malasakit Center desk';
    if (organizationName) destination += language === 'en' ? ` at ${organizationName}` : ` sa ${organizationName}`;
    if (scenario === 'dialysis' || scenario === 'chemotherapy') destination += language === 'en' ? ' and bring the next treatment schedule' : language === 'cebuano' ? ' ug dad-a ang iskedyul sa sunod nga tambal' : language === 'ilocano' ? ' ken dalusen ti sumaruno a iskedyul ti panagagas' : ' at dalhin ang iskedyul ng susunod na gamutan';
  }
  if (pillar === 'education' && organizationName) destination += `: ${organizationName}`;
  if (pillar === 'worker' && scenario === 'wages') {
    destination = language === 'en' ? 'Start at the nearest DOLE Single Entry Assistance (SEnA) desk' : language === 'cebuano' ? 'Sugdi sa pinakaduol nga DOLE SEnA desk' : language === 'ilocano' ? 'Rugian iti asideg a DOLE SEnA desk' : 'Magsimula sa pinakamalapit na DOLE SEnA desk';
    papers = language === 'en' ? ['Employment dates and employer details', 'Payslips, time records, or contract', 'A written list of unpaid wages or final pay'] : language === 'cebuano' ? ['Mga petsa sa trabaho ug ngalan sa employer', 'Payslip, time record, o kontrata', 'Lista sa wala mabayri nga sweldo o final pay'] : language === 'ilocano' ? ['Petsa ti panagtrabaho ken nagan ti employer', 'Payslip, time record, wenno kontrata', 'Listaan ti saan a nabayadan a sueldo wenno final pay'] : ['Petsa ng trabaho at detalye ng employer', 'Payslip, time record, o kontrata', 'Nakasulat na listahan ng hindi nabayarang sahod o final pay'];
    script = language === 'en' ? 'My wages or final pay have not been paid. How can I start a free SEnA request?' : language === 'cebuano' ? 'Wala pa nabayri ang akong sweldo o final pay. Unsaon nako pagsugod sa libre nga SEnA?' : language === 'ilocano' ? 'Saan pay a nabayadan ti sueldo wenno final pay ko. Kasano ti panagrugi iti libre a SEnA?' : 'Hindi pa po bayad ang sahod o final pay ko. Paano po magsimula sa libreng SEnA?';
  }
  if (pillar === 'worker' && scenario === 'livelihood') {
    destination = language === 'en' ? 'Start at your local Public Employment Service Office (PESO) or DOLE field office' : language === 'cebuano' ? 'Sugdi sa inyong Public Employment Service Office (PESO) o DOLE field office' : language === 'ilocano' ? 'Rugian iti Public Employment Service Office (PESO) wenno DOLE field office iti lugarmo' : 'Magsimula sa Public Employment Service Office (PESO) o DOLE field office sa lugar mo';
    papers = language === 'en' ? ['Valid ID', 'A short livelihood or business plan', 'Estimated costs or price quotes for needed tools, if available'] : language === 'cebuano' ? ['Balidong ID', 'Mubo nga plano sa panginabuhian o negosyo', 'Gibanabanang gasto o presyo sa mga gamit, kon anaa'] : language === 'ilocano' ? ['Umiso nga ID', 'Ababa a plano ti pangbiag wenno negosyo', 'Pagarup a gastos wenno presyo dagiti kasapulan a gamit, no adda'] : ['Valid ID', 'Maikling plano sa kabuhayan o negosyo', 'Tantiyang gastos o presyo ng kailangang gamit kung mayroon'];
    script = language === 'en' ? 'What livelihood help is available here, and what should I prepare to apply?' : language === 'cebuano' ? 'Unsang tabang sa panginabuhian ang anaa dinhi, ug unsay akong andamon sa pag-apply?' : language === 'ilocano' ? 'Ania a tulong iti pangbiag ti adda ditoy, ken ania ti isaganaak no ag-aplayak?' : 'Anong tulong pangkabuhayan ang mayroon dito, at ano ang ihahanda ko para mag-apply?';
  }
  if (pillar === 'worker' && scenario === 'loans') destination = language === 'en' ? 'Ask SSS, GSIS, or Pag-IBIG which loan fits your membership record' : language === 'cebuano' ? 'Pangutana sa SSS, GSIS, o Pag-IBIG kon unsang loan ang angay sa imong rekord' : language === 'ilocano' ? 'Damagem iti SSS, GSIS, wenno Pag-IBIG no ania a loan ti maiyataday iti rekordmo' : 'Itanong sa SSS, GSIS, o Pag-IBIG kung aling loan ang tugma sa record mo';
  if (pillar === 'worker' && scenario === 'pension_savings') {
    const agency = sector === 'government' ? 'GSIS' : 'SSS';
    destination = language === 'en' ? `Ask ${agency} about your pension record and Pag-IBIG about MP2 savings` : language === 'cebuano' ? `Pangutana sa ${agency} bahin sa pension record ug sa Pag-IBIG bahin sa MP2 savings` : language === 'ilocano' ? `Damagen iti ${agency} maipapan iti rekord ti pensiyon ken iti Pag-IBIG maipapan iti MP2 savings` : `Itanong sa ${agency} ang pension record at sa Pag-IBIG ang MP2 savings`;
    papers = language === 'en' ? ['Valid ID', `${agency} contribution record`, 'Pag-IBIG MP2 account details or passbook, if available'] : language === 'cebuano' ? ['Balidong ID', `Rekord sa hulog sa ${agency}`, 'Detalye sa Pag-IBIG MP2 account o passbook, kon anaa'] : language === 'ilocano' ? ['Umiso nga ID', `Rekord ti kontribusion iti ${agency}`, 'Detalye ti Pag-IBIG MP2 account wenno passbook, no adda'] : ['Valid ID', `Rekord ng hulog sa ${agency}`, 'Detalye ng Pag-IBIG MP2 account o passbook kung mayroon'];
  }
  if (pillar === 'worker' && scenario !== 'wages' && scenario !== 'livelihood' && scenario !== 'loans' && scenario !== 'pension_savings') {
    const agency = sector === 'government' ? 'GSIS' : 'SSS';
    destination = language === 'en' ? `Ask ${agency} about the claim and the records it needs` : language === 'cebuano' ? `Pangutana sa ${agency} bahin sa claim ug mga rekord nga gikinahanglan` : language === 'ilocano' ? `Damagem iti ${agency} maipapan iti claim ken dagiti kasapulan a rekord` : `Itanong sa ${agency} ang tungkol sa claim at mga rekord na kailangan`;
  }

  return <section aria-labelledby={`quick-start-${pillar}`} className="rounded-2xl border border-blue-200 bg-blue-50/70 p-4 sm:p-5 space-y-4">
    <h2 id={`quick-start-${pillar}`} className="text-lg font-bold text-slate-900">{text.quickStart}</h2>
    <ol className="grid gap-3 md:grid-cols-3">
      {text.actions.map((action, index) => <li key={action} className="rounded-xl border border-blue-100 bg-white p-3 text-sm leading-relaxed">
        <h3 className="mb-1 font-bold text-blue-950">{index + 1}. {action}</h3>
        {index === 0 ? <p>{destination}</p> : index === 1 ? <ul className="list-disc space-y-1 pl-5">{papers.map(paper => <li key={paper}>{paper}</li>)}</ul> : <p>{script}</p>}
      </li>)}
    </ol>
  </section>;
}

export function PlainLanguageGlossaryCard({ pillar, language }: { pillar: Pillar; language: Language }) {
  const text = copy[language];
  return <details className="rounded-2xl border border-[#E2DFD6] bg-white">
    <summary className="min-h-[44px] cursor-pointer p-4 font-semibold text-slate-900 focus-ring">{text.glossary}</summary>
    <dl className="grid gap-3 border-t border-[#E2DFD6] p-4 sm:grid-cols-2">
      {text.glossaryTerms[pillar].map(([term, meaning]) => <div key={term} className="text-sm leading-relaxed">
        <dt className="font-bold text-slate-900">{term}</dt>
        <dd className="mt-1 text-slate-700">{meaning}</dd>
      </div>)}
    </dl>
  </details>;
}
