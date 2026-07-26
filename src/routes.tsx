import { Routes, Route } from 'react-router-dom'
import AppShell from '@/components/layout/AppShell'
import Dashboard from '@/pages/Dashboard'
import Tresorerie from '@/pages/Tresorerie'
import Telephones from '@/pages/Telephones'
import PhoneDetail from '@/pages/Telephones/PhoneDetail'
import Pieces from '@/pages/Pieces'
import PartDetail from '@/pages/Pieces/PartDetail'
import Reparations from '@/pages/Reparations'
import Depenses from '@/pages/Depenses'
import Bilan from '@/pages/Bilan'
import Journal from '@/pages/Journal'
import Reglages from '@/pages/Reglages'
import AchatTelephoneForm from '@/components/quick-actions/forms/AchatTelephoneForm'
import AchatPiecesForm from '@/components/quick-actions/forms/AchatPiecesForm'
import UtilisationPieceForm from '@/components/quick-actions/forms/UtilisationPieceForm'
import ReparationForm from '@/components/quick-actions/forms/ReparationForm'
import VenteTelephoneForm from '@/components/quick-actions/forms/VenteTelephoneForm'
import DepenseForm from '@/components/quick-actions/forms/DepenseForm'

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/tresorerie" element={<Tresorerie />} />
        <Route path="/telephones" element={<Telephones />} />
        <Route path="/telephones/:id" element={<PhoneDetail />} />
        <Route path="/pieces" element={<Pieces />} />
        <Route path="/pieces/:id" element={<PartDetail />} />
        <Route path="/reparations" element={<Reparations />} />
        <Route path="/depenses" element={<Depenses />} />
        <Route path="/bilan" element={<Bilan />} />
        <Route path="/journal" element={<Journal />} />
        <Route path="/reglages" element={<Reglages />} />
        <Route path="/nouveau/achat-telephone" element={<AchatTelephoneForm />} />
        <Route path="/nouveau/achat-pieces" element={<AchatPiecesForm />} />
        <Route path="/nouveau/utilisation-piece" element={<UtilisationPieceForm />} />
        <Route path="/nouveau/reparation" element={<ReparationForm />} />
        <Route path="/nouveau/vente-telephone" element={<VenteTelephoneForm />} />
        <Route path="/nouveau/depense" element={<DepenseForm />} />
      </Route>
    </Routes>
  )
}
