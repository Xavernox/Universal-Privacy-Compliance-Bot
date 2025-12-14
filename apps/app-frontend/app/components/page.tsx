'use client';

import { useState } from 'react';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  Input,
  Textarea,
  Select,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeader,
  TableCell,
  Modal,
  Badge,
  Skeleton,
  LoadingSpinner,
} from '@/components/ui';

export default function ComponentsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="space-y-12">
      <div>
        <h1 className="text-4xl font-bold mb-4">Component Showcase</h1>
        <p className="text-neutral-600 dark:text-neutral-400">
          Explore all the reusable UI components available in the UI kit.
        </p>
      </div>

      {/* Buttons */}
      <section className="space-y-4">
        <h2 className="text-3xl font-bold">Buttons</h2>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex flex-wrap gap-4">
                <Button variant="primary">Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="danger">Danger</Button>
              </div>
              <div className="flex flex-wrap gap-4">
                <Button size="sm">Small</Button>
                <Button size="md">Medium</Button>
                <Button size="lg">Large</Button>
              </div>
              <div className="flex gap-4">
                <Button isLoading>Loading</Button>
                <Button disabled>Disabled</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Cards */}
      <section className="space-y-4">
        <h2 className="text-3xl font-bold">Cards</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card hover>
            <CardHeader>
              <CardTitle>Card with Header</CardTitle>
            </CardHeader>
            <CardContent>This is a card with a header, content, and footer sections.</CardContent>
            <CardFooter>
              <Button size="sm">Action</Button>
            </CardFooter>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <p className="text-neutral-600 dark:text-neutral-400">
                This is a simple card with just content.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Form Inputs */}
      <section className="space-y-4">
        <h2 className="text-3xl font-bold">Form Inputs</h2>
        <Card>
          <CardContent className="pt-6 space-y-4">
            <Input label="Text Input" placeholder="Enter text..." />
            <Input label="With Error" error="This field is required" />
            <Textarea label="Textarea" placeholder="Enter your message..." rows={4} />
            <Select
              label="Select Option"
              options={[
                { value: '1', label: 'Option 1' },
                { value: '2', label: 'Option 2' },
                { value: '3', label: 'Option 3' },
              ]}
            />
          </CardContent>
        </Card>
      </section>

      {/* Table */}
      <section className="space-y-4">
        <h2 className="text-3xl font-bold">Table</h2>
        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>Name</TableHeader>
              <TableHeader>Email</TableHeader>
              <TableHeader>Status</TableHeader>
              <TableHeader align="right">Actions</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell>John Doe</TableCell>
              <TableCell>john@example.com</TableCell>
              <TableCell>
                <Badge variant="success">Active</Badge>
              </TableCell>
              <TableCell align="right">
                <Button size="sm" variant="ghost">
                  Edit
                </Button>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Jane Smith</TableCell>
              <TableCell>jane@example.com</TableCell>
              <TableCell>
                <Badge variant="warning">Pending</Badge>
              </TableCell>
              <TableCell align="right">
                <Button size="sm" variant="ghost">
                  Edit
                </Button>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Bob Johnson</TableCell>
              <TableCell>bob@example.com</TableCell>
              <TableCell>
                <Badge variant="error">Inactive</Badge>
              </TableCell>
              <TableCell align="right">
                <Button size="sm" variant="ghost">
                  Edit
                </Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </section>

      {/* Badges */}
      <section className="space-y-4">
        <h2 className="text-3xl font-bold">Badges</h2>
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4">
              <Badge variant="primary">Primary</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="success">Success</Badge>
              <Badge variant="warning">Warning</Badge>
              <Badge variant="error">Error</Badge>
              <Badge variant="info">Info</Badge>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Skeleton & Loading */}
      <section className="space-y-4">
        <h2 className="text-3xl font-bold">Loading States</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Skeleton Loaders</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton height={20} />
              <Skeleton height={20} width="80%" />
              <div className="flex gap-4">
                <Skeleton width={48} height={48} className="rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton height={20} width="60%" />
                  <Skeleton height={16} width="40%" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Loading Spinners</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex gap-8 items-center">
                <LoadingSpinner size="sm" variant="primary" />
                <LoadingSpinner size="md" variant="secondary" />
                <LoadingSpinner size="lg" variant="primary" />
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Modal */}
      <section className="space-y-4">
        <h2 className="text-3xl font-bold">Modal</h2>
        <Card>
          <CardContent className="pt-6">
            <Button onClick={() => setIsModalOpen(true)}>Open Modal</Button>
          </CardContent>
        </Card>

        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Example Modal"
          size="md"
        >
          <div className="space-y-4">
            <p>This is a modal dialog. You can add any content here.</p>
            <Input label="Example Input" placeholder="Enter text..." />
            <div className="flex gap-3">
              <Button variant="primary" onClick={() => setIsModalOpen(false)}>
                Confirm
              </Button>
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </Modal>
      </section>

      {/* Badges by Size */}
      <section className="space-y-4">
        <h2 className="text-3xl font-bold">Badge Sizes</h2>
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4 items-center">
              <Badge size="sm">Small</Badge>
              <Badge size="md">Medium</Badge>
              <Badge size="lg">Large</Badge>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
