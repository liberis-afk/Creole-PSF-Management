import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';

const LIBELLE_TYPE: Record<string, string> = {
  TRACTEUR: 'Tracteur', CAMION: 'Camion', MOTO: 'Moto', POMPE: 'Pompe',
  GENERATEUR: 'Générateur', OUTIL: 'Outil', SYSTEME_IRRIGATION: 'Système d\'irrigation', AUTRE: 'Autre',
};
const LIBELLE_ETAT: Record<string, string> = {
  NEUF: 'Neuf', BON: 'Bon', MOYEN: 'Moyen', EN_PANNE: 'En panne',
};

export interface FichierExport {
  buffer: Buffer;
  contentType: string;
  nomFichier: string;
}

/**
 * Export de la liste des équipements en CSV, Excel ou PDF.
 *
 * - CSV : natif, aucune dépendance.
 * - Excel (.xlsx) : via `exceljs`.
 * - PDF : via `pdfkit`.
 *
 * exceljs et pdfkit sont importés dynamiquement pour ne charger la librairie
 * que si le format correspondant est demandé (et éviter de faire échouer le
 * démarrage si une dépendance optionnelle manque). Ce module d'export est
 * autonome ; le générateur global de rapports (Module 14) le remplacera à
 * terme.
 */
@Injectable()
export class EquipementsExportService {
  constructor(private readonly prisma: PrismaService) {}

  async exporter(fermeId: string, format: string): Promise<FichierExport> {
    const equipements = await this.chargerDonnees(fermeId);
    const date = new Date().toISOString().slice(0, 10);

    switch (format) {
      case 'csv':
        return { buffer: this.genererCsv(equipements), contentType: 'text/csv; charset=utf-8', nomFichier: `equipements-${date}.csv` };
      case 'xlsx':
        return { buffer: await this.genererExcel(equipements), contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', nomFichier: `equipements-${date}.xlsx` };
      case 'pdf':
        return { buffer: await this.genererPdf(equipements, date), contentType: 'application/pdf', nomFichier: `equipements-${date}.pdf` };
      default:
        throw new BadRequestException('Format non supporté (csv, xlsx ou pdf).');
    }
  }

  private async chargerDonnees(fermeId: string) {
    const equipements = await this.prisma.equipement.findMany({
      where: { fermeId },
      orderBy: { nom: 'asc' },
      include: {
        responsable: { select: { prenom: true, nom: true } },
        entretiens: { select: { cout: true } },
        utilisations: { select: { heuresUtilisation: true } },
      },
    });
    return equipements.map((e) => ({
      nom: e.nom,
      type: LIBELLE_TYPE[e.type] ?? e.type,
      numeroSerie: e.numeroSerie ?? '',
      etat: LIBELLE_ETAT[e.etat] ?? e.etat,
      dateAchat: e.dateAchat ? e.dateAchat.toISOString().slice(0, 10) : '',
      coutAchat: e.coutAchat ? e.coutAchat.toNumber() : 0,
      localisation: e.localisation ?? '',
      responsable: e.responsable ? `${e.responsable.prenom} ${e.responsable.nom}` : '',
      coutMaintenance: Math.round(e.entretiens.reduce((s, x) => s + (x.cout ? x.cout.toNumber() : 0), 0) * 100) / 100,
      heuresUtilisation: Math.round(e.utilisations.reduce((s, x) => s + x.heuresUtilisation.toNumber(), 0) * 100) / 100,
    }));
  }

  private readonly colonnes = [
    { cle: 'nom', titre: 'Nom' },
    { cle: 'type', titre: 'Type' },
    { cle: 'numeroSerie', titre: 'N° série' },
    { cle: 'etat', titre: 'État' },
    { cle: 'dateAchat', titre: "Date d'achat" },
    { cle: 'coutAchat', titre: "Valeur d'achat" },
    { cle: 'localisation', titre: 'Localisation' },
    { cle: 'responsable', titre: 'Responsable' },
    { cle: 'coutMaintenance', titre: 'Coût maintenance' },
    { cle: 'heuresUtilisation', titre: "Heures d'utilisation" },
  ] as const;

  // -------------------------------------------------------------------- CSV
  private genererCsv(lignes: Array<Record<string, unknown>>): Buffer {
    const echapper = (v: unknown) => {
      const s = String(v ?? '');
      return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const entete = this.colonnes.map((c) => c.titre).join(';');
    const corps = lignes.map((l) => this.colonnes.map((c) => echapper(l[c.cle])).join(';')).join('\n');
    // BOM UTF-8 pour qu'Excel ouvre correctement les accents.
    return Buffer.from('\uFEFF' + entete + '\n' + corps, 'utf-8');
  }

  // ------------------------------------------------------------------ EXCEL
  private async genererExcel(lignes: Array<Record<string, unknown>>): Promise<Buffer> {
    // Import dynamique : la dépendance n'est chargée qu'à l'export Excel.
    const ExcelJS = await import('exceljs');
    const workbook = new ExcelJS.Workbook();
    const feuille = workbook.addWorksheet('Équipements');

    feuille.columns = this.colonnes.map((c) => ({ header: c.titre, key: c.cle, width: 20 }));
    feuille.getRow(1).font = { bold: true };
    lignes.forEach((l) => feuille.addRow(l));

    const arrayBuffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(arrayBuffer);
  }

  // -------------------------------------------------------------------- PDF
  private async genererPdf(lignes: Array<Record<string, unknown>>, date: string): Promise<Buffer> {
    const PDFDocument = (await import('pdfkit')).default;

    return new Promise<Buffer>((resolve, reject) => {
      try {
        const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 30 });
        const morceaux: Buffer[] = [];
        doc.on('data', (c: Buffer) => morceaux.push(c));
        doc.on('end', () => resolve(Buffer.concat(morceaux)));

        doc.fontSize(16).text('Liste des équipements', { align: 'left' });
        doc.fontSize(9).fillColor('#666').text(`Généré le ${date}`);
        doc.moveDown(0.5);

        // En-tête de tableau simple (colonnes principales pour rester lisible).
        const cols = ['Nom', 'Type', 'État', 'Responsable', 'Coût maint.', 'Heures'];
        const largeurs = [180, 110, 70, 150, 90, 70];
        let y = doc.y;
        const dessinerLigne = (valeurs: string[], gras = false) => {
          let x = 30;
          doc.fontSize(9).fillColor(gras ? '#000' : '#333').font(gras ? 'Helvetica-Bold' : 'Helvetica');
          valeurs.forEach((v, i) => {
            doc.text(v, x, y, { width: largeurs[i], ellipsis: true });
            x += largeurs[i];
          });
          y += 18;
          if (y > 520) { doc.addPage(); y = 40; }
        };

        dessinerLigne(cols, true);
        for (const l of lignes) {
          dessinerLigne([
            String(l.nom ?? ''),
            String(l.type ?? ''),
            String(l.etat ?? ''),
            String(l.responsable ?? ''),
            String(l.coutMaintenance ?? 0),
            String(l.heuresUtilisation ?? 0),
          ]);
        }

        doc.end();
      } catch (e) {
        reject(e instanceof Error ? e : new Error('Erreur PDF'));
      }
    });
  }
}
