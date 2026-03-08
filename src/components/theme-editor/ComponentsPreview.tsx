import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar } from '@/components/ui/calendar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DollarSign, Users, CreditCard, Activity, Github, Star, TrendingUp, TrendingDown, MoreHorizontal, Search, Plus, ArrowUpRight, Bell, Settings } from 'lucide-react';
import { useState } from 'react';

export function ComponentsPreview() {
  const [date, setDate] = useState<Date | undefined>(new Date());

  return (
    <ScrollArea className="h-full flex-1">
      <div className="p-6 space-y-8">

        {/* ── Dashboard Cards Row ── */}
        <section className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Total Revenue */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$15,231.89</div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="size-3 text-emerald-500" />
                  <span className="text-emerald-500">+20.1%</span> from last month
                </p>
              </CardContent>
            </Card>

            {/* Subscriptions */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Subscriptions</CardTitle>
                <Users className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">+2,350</div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="size-3 text-emerald-500" />
                  <span className="text-emerald-500">+180.1%</span> from last month
                </p>
                <div className="flex items-end gap-1 mt-3 h-10">
                  {[40, 65, 55, 80, 70, 90, 60].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-sm bg-primary"
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Calendar */}
            <Card className="overflow-hidden">
              <CardContent className="p-0 flex items-center justify-center">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  className="w-full"
                />
              </CardContent>
            </Card>
          </div>
        </section>

        {/* ── Forms Row ── */}
        <section className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Upgrade Subscription Form */}
            <Card>
              <CardHeader>
                <CardTitle>Upgrade your subscription</CardTitle>
                <CardDescription>
                  You are currently on the free plan. Upgrade to get access to all features.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input placeholder="John Doe" />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input placeholder="email@example.com" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-1 space-y-2">
                    <Label>Card Number</Label>
                    <Input placeholder="1234 1234 1234 1234" />
                  </div>
                  <div className="space-y-2">
                    <Label>Expires</Label>
                    <Input placeholder="MM/YY" />
                  </div>
                  <div className="space-y-2">
                    <Label>CVC</Label>
                    <Input placeholder="CVC" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Plan</Label>
                  <RadioGroup defaultValue="starter" className="grid grid-cols-2 gap-4">
                    <Label
                      htmlFor="starter"
                      className="flex items-start gap-3 rounded-md border border-input p-3 cursor-pointer has-[:checked]:border-primary [&:has(:checked)]:border-primary"
                    >
                      <RadioGroupItem value="starter" id="starter" className="mt-0.5" />
                      <div>
                        <div className="font-medium text-sm">Starter</div>
                        <div className="text-xs text-muted-foreground">Perfect for small businesses</div>
                      </div>
                    </Label>
                    <Label
                      htmlFor="pro"
                      className="flex items-start gap-3 rounded-md border border-input p-3 cursor-pointer has-[:checked]:border-primary [&:has(:checked)]:border-primary"
                    >
                      <RadioGroupItem value="pro" id="pro" className="mt-0.5" />
                      <div>
                        <div className="font-medium text-sm">Pro Plan</div>
                        <div className="text-xs text-muted-foreground">More features and storage</div>
                      </div>
                    </Label>
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea placeholder="Enter notes" />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox id="terms" />
                  <Label htmlFor="terms" className="text-sm font-normal">
                    I agree to the terms and conditions
                  </Label>
                </div>
              </CardContent>
            </Card>

            {/* Create an Account */}
            <div className="space-y-4">
              <Card>
                <CardHeader className="text-center">
                  <CardTitle>Create an account</CardTitle>
                  <CardDescription>Enter your email below to create your account</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Button variant="outline" className="w-full">
                      <Github className="size-4 mr-2" />
                      GitHub
                    </Button>
                    <Button variant="outline" className="w-full">
                      <svg className="size-4 mr-2" viewBox="0 0 24 24">
                        <path
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                          fill="currentColor"
                        />
                        <path
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          fill="currentColor"
                        />
                        <path
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          fill="currentColor"
                        />
                        <path
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          fill="currentColor"
                        />
                      </svg>
                      Google
                    </Button>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <Separator className="w-full" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input placeholder="m@example.com" />
                  </div>
                  <div className="space-y-2">
                    <Label>Password</Label>
                    <Input type="password" />
                  </div>
                  <Button className="w-full">Create account</Button>
                </CardContent>
              </Card>

              {/* Team Members mini card */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Team Members</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { name: 'Sofia Davis', email: 'm@example.com', role: 'Owner', initials: 'SD' },
                    { name: 'Jackson Lee', email: 'p@example.com', role: 'Member', initials: 'JL' },
                  ].map((user) => (
                    <div key={user.email} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="size-8">
                          <AvatarFallback className="text-xs">{user.initials}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium leading-none">{user.name}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">{user.role}</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* ── Notifications / Tabs Section ── */}
        <section className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Notifications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="size-4" />
                  Notifications
                </CardTitle>
                <CardDescription>You have 3 unread messages.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { title: 'Your call has been confirmed.', time: '1 hour ago', read: false },
                  { title: 'You have a new message!', time: '2 hours ago', read: false },
                  { title: 'Your subscription is expiring soon!', time: '5 hours ago', read: true },
                ].map((n, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className={`mt-1.5 size-2 rounded-full shrink-0 ${n.read ? 'bg-muted' : 'bg-primary'}`} />
                    <div className="flex-1">
                      <p className="text-sm font-medium leading-none">{n.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{n.time}</p>
                    </div>
                  </div>
                ))}
                <Button variant="outline" size="sm" className="w-full mt-2">
                  Mark all as read
                </Button>
              </CardContent>
            </Card>

            {/* Analytics Tabs */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="overview">
                  <TabsList className="w-full">
                    <TabsTrigger value="overview" className="flex-1">Overview</TabsTrigger>
                    <TabsTrigger value="analytics" className="flex-1">Analytics</TabsTrigger>
                    <TabsTrigger value="reports" className="flex-1">Reports</TabsTrigger>
                  </TabsList>
                  <TabsContent value="overview" className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Sales</span>
                        <span className="text-muted-foreground">78%</span>
                      </div>
                      <Progress value={78} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Revenue</span>
                        <span className="text-muted-foreground">63%</span>
                      </div>
                      <Progress value={63} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Customers</span>
                        <span className="text-muted-foreground">45%</span>
                      </div>
                      <Progress value={45} className="h-2" />
                    </div>
                  </TabsContent>
                  <TabsContent value="analytics" className="pt-4">
                    <p className="text-sm text-muted-foreground">Analytics data preview.</p>
                  </TabsContent>
                  <TabsContent value="reports" className="pt-4">
                    <p className="text-sm text-muted-foreground">Reports data preview.</p>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* ── Buttons & Badges ── */}
        <section className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Buttons</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Button>Primary</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="destructive">Destructive</Button>
                  <Button variant="link">Link</Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm">Small</Button>
                  <Button size="default">Default</Button>
                  <Button size="lg">Large</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Badges</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Badge>Default</Badge>
                  <Badge variant="secondary">Secondary</Badge>
                  <Badge variant="outline">Outline</Badge>
                  <Badge variant="destructive">Destructive</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* ── Table ── */}
        <section>
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Recent Orders</CardTitle>
                <Button variant="outline" size="sm">
                  <Plus className="size-3 mr-1" />
                  Add
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    { invoice: 'INV001', status: 'Paid', method: 'Credit Card', amount: '$250.00' },
                    { invoice: 'INV002', status: 'Pending', method: 'PayPal', amount: '$150.00' },
                    { invoice: 'INV003', status: 'Paid', method: 'Bank Transfer', amount: '$350.00' },
                    { invoice: 'INV004', status: 'Failed', method: 'Credit Card', amount: '$450.00' },
                  ].map((row) => (
                    <TableRow key={row.invoice}>
                      <TableCell className="font-medium">{row.invoice}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            row.status === 'Paid'
                              ? 'default'
                              : row.status === 'Pending'
                                ? 'secondary'
                                : 'destructive'
                          }
                          className="text-xs"
                        >
                          {row.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{row.method}</TableCell>
                      <TableCell className="text-right">{row.amount}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </section>

        {/* ── Form Elements ── */}
        <section className="space-y-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Form Elements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Input Field</Label>
                    <Input placeholder="Type something..." />
                  </div>
                  <div className="space-y-2">
                    <Label>Search</Label>
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                      <Input placeholder="Search..." className="pl-8" />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Select</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an option" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="option1">Option 1</SelectItem>
                        <SelectItem value="option2">Option 2</SelectItem>
                        <SelectItem value="option3">Option 3</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Textarea</Label>
                    <Textarea placeholder="Write a message..." className="min-h-[60px]" />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch id="theme-switch" />
                    <Label htmlFor="theme-switch">Toggle switch</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="theme-checkbox" />
                    <Label htmlFor="theme-checkbox">Checkbox option</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="theme-checkbox-2" defaultChecked />
                    <Label htmlFor="theme-checkbox-2">Checked option</Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* ── Color Palette ── */}
        <section className="space-y-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Color Palette</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
                {[
                  { bg: 'bg-background', label: 'Background', border: true },
                  { bg: 'bg-foreground', label: 'Foreground' },
                  { bg: 'bg-primary', label: 'Primary' },
                  { bg: 'bg-secondary', label: 'Secondary' },
                  { bg: 'bg-accent', label: 'Accent' },
                  { bg: 'bg-muted', label: 'Muted' },
                  { bg: 'bg-destructive', label: 'Destructive' },
                  { bg: 'bg-card', label: 'Card', border: true },
                ].map((color) => (
                  <div key={color.label} className="space-y-1">
                    <div className={`h-12 rounded-md ${color.bg} ${color.border ? 'border' : ''}`} />
                    <p className="text-[10px] text-center text-muted-foreground">{color.label}</p>
                  </div>
                ))}
              </div>

              {/* Chart Colors */}
              <div className="mt-4 space-y-2">
                <p className="text-xs text-muted-foreground">Chart Colors</p>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                    <div
                      key={n}
                      className="flex-1 h-8 rounded-md first:rounded-l-lg last:rounded-r-lg"
                      style={{ backgroundColor: `hsl(var(--chart-${n}))` }}
                    />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

      </div>
    </ScrollArea>
  );
}
