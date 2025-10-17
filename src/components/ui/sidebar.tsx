"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { VariantProps, cva } from "class-variance-authority"
import { PanelLeft } from "lucide-react"

import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Logo } from "@/components/logo"
import { MainNav } from "@/components/main-nav"

type SidebarContext = {
  open: boolean
  setOpen: (open: boolean) => void
  isMobile: boolean
}

const SidebarContext = React.createContext<SidebarContext | null>(null)

export function useSidebar() {
  const context = React.useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.")
  }

  return context
}

export const SidebarProvider = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(
  (
    {
      className,
      children,
      ...props
    },
    ref
  ) => {
    const isMobile = useIsMobile()
    const [open, setOpen] = React.useState(false)

    const contextValue = React.useMemo<SidebarContext>(
      () => ({
        open,
        setOpen,
        isMobile,
      }),
      [open, setOpen, isMobile]
    )

    return (
      <SidebarContext.Provider value={contextValue}>
        <TooltipProvider delayDuration={0}>
          <div
            ref={ref}
            className={cn(className)}
            {...props}
          >
            {children}
          </div>
        </TooltipProvider>
      </SidebarContext.Provider>
    )
  }
)
SidebarProvider.displayName = "SidebarProvider"

export const Sidebar = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"aside">
>(
  (
    {
      className,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <aside
        ref={ref}
        className={cn("fixed left-0 top-0 z-40 hidden h-screen w-14 flex-col border-r bg-background sm:flex", className)}
        {...props}
      >
        {children}
      </aside>
    )
  }
)
Sidebar.displayName = "Sidebar"

export const SidebarTrigger = React.forwardRef<
  React.ElementRef<typeof Button>,
  React.ComponentProps<typeof Button> & { asChild?: boolean }
>(({ className, asChild, ...props }, ref) => {
  const { open, setOpen, isMobile } = useSidebar()

  if(!isMobile) return null;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button ref={ref} size="icon" variant="outline" className={cn("sm:hidden", className)} {...props} >
            <PanelLeft className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="sm:max-w-xs">
        <nav className="grid gap-6 text-lg font-medium">
          <Logo />
          {/* This is a bit of a hack to get the nav items from MainNav */}
          <div onClick={() => setOpen(false)}>
            <MainNav userRole={'admin'} />
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  )
})
SidebarTrigger.displayName = "SidebarTrigger"


export const SidebarHeader = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("flex h-14 items-center justify-center border-b", className)}
      {...props}
    />
  )
})
SidebarHeader.displayName = "SidebarHeader"

export const SidebarFooter = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("mt-auto flex flex-col items-center gap-4 p-2", className)}
      {...props}
    />
  )
})
SidebarFooter.displayName = "SidebarFooter"


export const SidebarContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "flex min-h-0 flex-1 flex-col gap-4 overflow-auto p-2",
        className
      )}
      {...props}
    />
  )
})
SidebarContent.displayName = "SidebarContent"


export const SidebarMenu = React.forwardRef<
  HTMLUListElement,
  React.ComponentProps<"ul">
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    data-sidebar="menu"
    className={cn("flex w-full min-w-0 flex-col items-center gap-2", className)}
    {...props}
  />
))
SidebarMenu.displayName = "SidebarMenu"

export const SidebarMenuItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentProps<"li">
>(({ className, ...props }, ref) => (
  <li
    ref={ref}
    data-sidebar="menu-item"
    className={cn("group/menu-item relative", className)}
    {...props}
  />
))
SidebarMenuItem.displayName = "SidebarMenuItem"

const sidebarMenuButtonVariants = cva(
  "flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8",
  {
    variants: {},
    defaultVariants: {},
  }
)

export const SidebarMenuButton = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> & {
    asChild?: boolean
    isActive?: boolean
    tooltip?: string | React.ComponentProps<typeof TooltipContent>
  } & VariantProps<typeof sidebarMenuButtonVariants>
>(
  (
    {
      asChild = false,
      isActive = false,
      tooltip,
      className,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button"
    const { isMobile } = useSidebar()
    
    const button = (
      <Comp
        ref={ref}
        data-active={isActive}
        className={cn(sidebarMenuButtonVariants(), isActive && "bg-accent text-accent-foreground", className)}
        {...props}
      />
    )

    if (isMobile) {
        return button
    }

    if (!tooltip) {
      return button
    }


    if (typeof tooltip === "string") {
      tooltip = {
        children: tooltip,
      }
    }

    return (
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent
          side="right"
          align="center"
          {...tooltip}
        />
      </Tooltip>
    )
  }
)
SidebarMenuButton.displayName = "SidebarMenuButton"
