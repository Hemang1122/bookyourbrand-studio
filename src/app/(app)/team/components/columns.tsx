"use client"

import { type ColumnDef } from "@tanstack/react-table"
import type { User } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { ArrowUpDown, Eye } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { PlaceHolderImages } from "@/lib/placeholder-images"
import { Badge } from "@/components/ui/badge"
import { ViewTeamMemberDetailsDialog } from "./view-team-member-details-dialog"

export const columns: ColumnDef<User>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const user = row.original;
      const avatar = PlaceHolderImages.find(img => img.id === user.avatar);
      return (
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={avatar?.imageUrl} alt={user.name} data-ai-hint={avatar?.imageHint}/>
            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <span className="font-medium">{user.name}</span>
        </div>
      )
    },
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ row }) => {
        const user = row.original;
        return <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>{user.role}</Badge>;
    }
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const teamMember = row.original
 
      return (
        <ViewTeamMemberDetailsDialog teamMember={teamMember}>
            <Button variant="outline" size="sm">
                <Eye className="mr-2 h-4 w-4" />
                View
            </Button>
        </ViewTeamMemberDetailsDialog>
      )
    },
  },
]
