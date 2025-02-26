import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  ProposalDiscovery, 
  ProposalGenerator, 
  FundDistributionDashboard 
} from "@/components/dao"

export const metadata = {
  title: "DAO Tools | Artist Grant AI Agent",
  description: "Discover, create, and manage DAO proposals and funds",
}

export default function DAOPage() {
  return (
    <div className="container py-10">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-bold mb-3">DAO Tools</h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Discover funding opportunities, create proposals, and manage your funds with our comprehensive DAO tools
        </p>
      </div>

      <Tabs defaultValue="discover" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="discover">Discover Proposals</TabsTrigger>
          <TabsTrigger value="create">Create Proposal</TabsTrigger>
          <TabsTrigger value="funds">Fund Dashboard</TabsTrigger>
        </TabsList>
        
        <TabsContent value="discover">
          <ProposalDiscovery />
        </TabsContent>
        
        <TabsContent value="create">
          <ProposalGenerator />
        </TabsContent>
        
        <TabsContent value="funds">
          <FundDistributionDashboard />
        </TabsContent>
      </Tabs>
    </div>
  )
} 