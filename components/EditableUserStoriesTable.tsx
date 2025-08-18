"use client";

import { useState, useMemo } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { 
  Edit3, 
  Save, 
  X, 
  Plus, 
  Trash2, 
  Download, 
  Filter, 
  Search,
  ArrowUpDown,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface UserStory {
  id: string;
  userStory: string;
  userStoryStatement: string;
  epic: string;
  stakeholderName: string;
  stakeholderRole: string;
  stakeholderTeam: string;
  category: string;
  changeCatalyst: string;
  useCaseId: string;
  priority: 'High' | 'Medium' | 'Low';
  confidence: number;
  tags: string[];
  lifecyclePhase?: string;
  source?: string;
  snippet?: string;
}

interface EditableUserStoriesTableProps {
  userStories: UserStory[];
  onStoriesChange: (stories: UserStory[]) => void;
  onDownload: (stories: UserStory[]) => void;
}

export function EditableUserStoriesTable({ 
  userStories, 
  onStoriesChange, 
  onDownload 
}: EditableUserStoriesTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingStory, setEditingStory] = useState<UserStory | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<keyof UserStory>('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [showFilters, setShowFilters] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [epicFilter, setEpicFilter] = useState<string>('all');
  const [teamFilter, setTeamFilter] = useState<string>('all');

  // Generate random use case ID
  const generateUseCaseId = () => {
    const year = new Date().getFullYear();
    const randomNum = Math.floor(Math.random() * 999) + 1;
    return `UC-${year}-${randomNum.toString().padStart(3, '0')}`;
  };

  // Get unique values for filters
  const uniqueEpics = useMemo(() => {
    return Array.from(new Set(userStories.map(story => story.epic).filter(Boolean)));
  }, [userStories]);

  const uniqueTeams = useMemo(() => {
    return Array.from(new Set(userStories.map(story => story.stakeholderTeam).filter(Boolean)));
  }, [userStories]);

  const uniqueCategories = useMemo(() => {
    return Array.from(new Set(userStories.map(story => story.category).filter(Boolean)));
  }, [userStories]);

  // Filter and sort stories
  const filteredAndSortedStories = useMemo(() => {
    let filtered = userStories.filter(story => {
      const matchesSearch = 
        story.userStory.toLowerCase().includes(searchTerm.toLowerCase()) ||
        story.userStoryStatement.toLowerCase().includes(searchTerm.toLowerCase()) ||
        story.epic.toLowerCase().includes(searchTerm.toLowerCase()) ||
        story.stakeholderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        story.stakeholderRole.toLowerCase().includes(searchTerm.toLowerCase()) ||
        story.stakeholderTeam.toLowerCase().includes(searchTerm.toLowerCase()) ||
        story.id.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesPriority = priorityFilter === 'all' || story.priority === priorityFilter;
      const matchesCategory = categoryFilter === 'all' || story.category === categoryFilter;
      const matchesEpic = epicFilter === 'all' || story.epic === epicFilter;
      const matchesTeam = teamFilter === 'all' || story.stakeholderTeam === teamFilter;
      
      return matchesSearch && matchesPriority && matchesCategory && matchesEpic && matchesTeam;
    });

    // Sort stories
    filtered.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      return 0;
    });

    return filtered;
  }, [userStories, searchTerm, sortField, sortDirection, priorityFilter, categoryFilter, epicFilter, teamFilter]);

  const startEditing = (story: UserStory) => {
    setEditingId(story.id);
    setEditingStory({ ...story });
  };

  const saveEdit = () => {
    if (editingStory && editingId) {
      const updatedStories = userStories.map(story => 
        story.id === editingId ? editingStory : story
      );
      onStoriesChange(updatedStories);
      setEditingId(null);
      setEditingStory(null);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingStory(null);
  };

  const deleteStory = (id: string) => {
    const updatedStories = userStories.filter(story => story.id !== id);
    onStoriesChange(updatedStories);
  };

  const addNewStory = () => {
    const newStory: UserStory = {
      id: `US-${userStories.length + 1}`,
      userStory: 'As a user, I need...',
      userStoryStatement: 'Brief description of the user story',
      epic: 'Epic Name',
      stakeholderName: 'Stakeholder Name',
      stakeholderRole: 'Stakeholder Role',
      stakeholderTeam: 'Stakeholder Team',
      category: 'Workflow',
      changeCatalyst: 'Change catalyst description',
      useCaseId: generateUseCaseId(),
      priority: 'Medium',
      confidence: 0.8,
      tags: [],
      lifecyclePhase: 'Execution',
      source: 'Manual Entry',
      snippet: ''
    };
    onStoriesChange([...userStories, newStory]);
  };

  const handleSort = (field: keyof UserStory) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortIcon = ({ field }: { field: keyof UserStory }) => {
    if (sortField !== field) return <ArrowUpDown className="w-4 h-4" />;
    return sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />;
  };

  const renderCell = (story: UserStory, field: keyof UserStory) => {
    if (editingId === story.id && editingStory) {
      switch (field) {
        case 'userStory':
          return (
            <Input
              value={editingStory.userStory}
              onChange={(e) => setEditingStory({ ...editingStory, userStory: e.target.value })}
              className="min-w-[300px]"
            />
          );
        case 'userStoryStatement':
          return (
            <Input
              value={editingStory.userStoryStatement}
              onChange={(e) => setEditingStory({ ...editingStory, userStoryStatement: e.target.value })}
              className="min-w-[200px]"
            />
          );
        case 'epic':
          return (
            <Input
              value={editingStory.epic}
              onChange={(e) => setEditingStory({ ...editingStory, epic: e.target.value })}
            />
          );
        case 'stakeholderName':
          return (
            <Input
              value={editingStory.stakeholderName}
              onChange={(e) => setEditingStory({ ...editingStory, stakeholderName: e.target.value })}
            />
          );
        case 'stakeholderRole':
          return (
            <Input
              value={editingStory.stakeholderRole}
              onChange={(e) => setEditingStory({ ...editingStory, stakeholderRole: e.target.value })}
            />
          );
        case 'stakeholderTeam':
          return (
            <Input
              value={editingStory.stakeholderTeam}
              onChange={(e) => setEditingStory({ ...editingStory, stakeholderTeam: e.target.value })}
            />
          );
        case 'category':
          return (
            <Input
              value={editingStory.category}
              onChange={(e) => setEditingStory({ ...editingStory, category: e.target.value })}
            />
          );
        case 'changeCatalyst':
          return (
            <Input
              value={editingStory.changeCatalyst}
              onChange={(e) => setEditingStory({ ...editingStory, changeCatalyst: e.target.value })}
              className="min-w-[200px]"
            />
          );
        case 'useCaseId':
          return (
            <div className="flex items-center space-x-2">
              <Input
                value={editingStory.useCaseId}
                onChange={(e) => setEditingStory({ ...editingStory, useCaseId: e.target.value })}
                className="w-32"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEditingStory({ ...editingStory, useCaseId: generateUseCaseId() })}
                className="h-6 px-2"
              >
                🔄
              </Button>
            </div>
          );
        case 'priority':
          return (
            <select
              value={editingStory.priority}
              onChange={(e) => setEditingStory({ ...editingStory, priority: e.target.value as 'High' | 'Medium' | 'Low' })}
              className="border rounded px-2 py-1 text-sm"
            >
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          );
        case 'confidence':
          return (
            <Input
              type="number"
              min="0"
              max="1"
              step="0.01"
              value={editingStory.confidence}
              onChange={(e) => setEditingStory({ ...editingStory, confidence: parseFloat(e.target.value) })}
              className="w-20"
            />
          );
        default:
          return story[field];
      }
    }

    // Display mode
    switch (field) {
      case 'useCaseId':
        return (
          <Badge variant="secondary" className="text-xs font-mono">
            {story.useCaseId}
          </Badge>
        );
      case 'priority':
        return (
          <Badge 
            variant={story.priority === 'High' ? 'destructive' : story.priority === 'Medium' ? 'default' : 'secondary'}
            className="text-xs"
          >
            {story.priority}
          </Badge>
        );
      case 'confidence':
        return (
          <Badge variant="outline" className="text-xs">
            {(story.confidence * 100).toFixed(0)}%
          </Badge>
        );
      case 'tags':
        return (
          <div className="flex flex-wrap gap-1">
            {story.tags.slice(0, 2).map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {story.tags.length > 2 && (
              <Badge variant="outline" className="text-xs">
                +{story.tags.length - 2}
              </Badge>
            )}
          </div>
        );
      default:
        return story[field];
    }
  };

  const renderActions = (story: UserStory) => {
    if (editingId === story.id) {
      return (
        <div className="flex space-x-1">
          <Button size="sm" onClick={saveEdit} className="h-6 px-2">
            <Save className="w-3 h-3" />
          </Button>
          <Button size="sm" variant="outline" onClick={cancelEdit} className="h-6 px-2">
            <X className="w-3 h-3" />
          </Button>
        </div>
      );
    }
    
    return (
      <div className="flex space-x-1">
        <Button size="sm" variant="outline" onClick={() => startEditing(story)} className="h-6 px-2">
          <Edit3 className="w-3 h-3" />
        </Button>
        <Button size="sm" variant="outline" onClick={() => deleteStory(story.id)} className="h-6 px-2 text-red-600">
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>
    );
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl text-slate-900">Edit User Stories</CardTitle>
            <CardDescription>
              Review and edit your user stories before downloading. Changes are saved automatically.
            </CardDescription>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
            <Button onClick={addNewStory}>
              <Plus className="w-4 h-4 mr-2" />
              Add Story
            </Button>
            <Button onClick={() => onDownload(filteredAndSortedStories)}>
              <Download className="w-4 h-4 mr-2" />
              Download CSV
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Search and Filters */}
        <div className="space-y-4 mb-6">
          <div className="flex space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search user stories..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
          
          {showFilters && (
            <div className="flex space-x-4">
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="border rounded px-3 py-2 text-sm"
              >
                <option value="all">All Priorities</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
              
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="border rounded px-3 py-2 text-sm"
              >
                <option value="all">All Categories</option>
                {uniqueCategories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>

              <select
                value={epicFilter}
                onChange={(e) => setEpicFilter(e.target.value)}
                className="border rounded px-3 py-2 text-sm"
              >
                <option value="all">All Epics</option>
                {uniqueEpics.map(epic => (
                  <option key={epic} value={epic}>{epic}</option>
                ))}
              </select>

              <select
                value={teamFilter}
                onChange={(e) => setTeamFilter(e.target.value)}
                className="border rounded px-3 py-2 text-sm"
              >
                <option value="all">All Teams</option>
                {uniqueTeams.map(team => (
                  <option key={team} value={team}>{team}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Stories Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left p-2 font-medium">
                  <Button 
                    variant="ghost" 
                    onClick={() => handleSort('id')}
                    className="h-auto p-0 font-medium hover:bg-slate-100"
                  >
                    ID <SortIcon field="id" />
                  </Button>
                </th>
                <th className="text-left p-2 font-medium">
                  <Button 
                    variant="ghost" 
                    onClick={() => handleSort('userStory')}
                    className="h-auto p-0 font-medium hover:bg-slate-100"
                  >
                    User Story <SortIcon field="userStory" />
                  </Button>
                </th>
                <th className="text-left p-2 font-medium">
                  <Button 
                    variant="ghost" 
                    onClick={() => handleSort('userStoryStatement')}
                    className="h-auto p-0 font-medium hover:bg-slate-100"
                  >
                    Statement <SortIcon field="userStoryStatement" />
                  </Button>
                </th>
                <th className="text-left p-2 font-medium">
                  <Button 
                    variant="ghost" 
                    onClick={() => handleSort('epic')}
                    className="h-auto p-0 font-medium hover:bg-slate-100"
                  >
                    Epic <SortIcon field="epic" />
                  </Button>
                </th>
                <th className="text-left p-2 font-medium">
                  <Button 
                    variant="ghost" 
                    onClick={() => handleSort('stakeholderName')}
                    className="h-auto p-0 font-medium hover:bg-slate-100"
                  >
                    Stakeholder <SortIcon field="stakeholderName" />
                  </Button>
                </th>
                <th className="text-left p-2 font-medium">
                  <Button 
                    variant="ghost" 
                    onClick={() => handleSort('stakeholderRole')}
                    className="h-auto p-0 font-medium hover:bg-slate-100"
                  >
                    Role <SortIcon field="stakeholderRole" />
                  </Button>
                </th>
                <th className="text-left p-2 font-medium">
                  <Button 
                    variant="ghost" 
                    onClick={() => handleSort('stakeholderTeam')}
                    className="h-auto p-0 font-medium hover:bg-slate-100"
                  >
                    Team <SortIcon field="stakeholderTeam" />
                  </Button>
                </th>
                <th className="text-left p-2 font-medium">
                  <Button 
                    variant="ghost" 
                    onClick={() => handleSort('category')}
                    className="h-auto p-0 font-medium hover:bg-slate-100"
                  >
                    Category <SortIcon field="category" />
                  </Button>
                </th>
                <th className="text-left p-2 font-medium">
                  <Button 
                    variant="ghost" 
                    onClick={() => handleSort('changeCatalyst')}
                    className="h-auto p-0 font-medium hover:bg-slate-100"
                  >
                    Change Catalyst <SortIcon field="changeCatalyst" />
                  </Button>
                </th>
                <th className="text-left p-2 font-medium">
                  <Button 
                    variant="ghost" 
                    onClick={() => handleSort('useCaseId')}
                    className="h-auto p-0 font-medium hover:bg-slate-100"
                  >
                    Use Case ID <SortIcon field="useCaseId" />
                  </Button>
                </th>
                <th className="text-left p-2 font-medium">
                  <Button 
                    variant="ghost" 
                    onClick={() => handleSort('priority')}
                    className="h-auto p-0 font-medium hover:bg-slate-100"
                  >
                    Priority <SortIcon field="priority" />
                  </Button>
                </th>
                <th className="text-left p-2 font-medium">
                  <Button 
                    variant="ghost" 
                    onClick={() => handleSort('confidence')}
                    className="h-auto p-0 font-medium hover:bg-slate-100"
                  >
                    Confidence <SortIcon field="confidence" />
                  </Button>
                </th>
                <th className="text-left p-2 font-medium">Tags</th>
                <th className="text-left p-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedStories.map((story) => (
                <tr key={story.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="p-2 font-mono text-xs">{story.id}</td>
                  <td className="p-2 max-w-xs">{renderCell(story, 'userStory')}</td>
                  <td className="p-2">{renderCell(story, 'userStoryStatement')}</td>
                  <td className="p-2">{renderCell(story, 'epic')}</td>
                  <td className="p-2">{renderCell(story, 'stakeholderName')}</td>
                  <td className="p-2">{renderCell(story, 'stakeholderRole')}</td>
                  <td className="p-2">{renderCell(story, 'stakeholderTeam')}</td>
                  <td className="p-2">{renderCell(story, 'category')}</td>
                  <td className="p-2">{renderCell(story, 'changeCatalyst')}</td>
                  <td className="p-2">{renderCell(story, 'useCaseId')}</td>
                  <td className="p-2">{renderCell(story, 'priority')}</td>
                  <td className="p-2">{renderCell(story, 'confidence')}</td>
                  <td className="p-2">{renderCell(story, 'tags')}</td>
                  <td className="p-2">{renderActions(story)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredAndSortedStories.length === 0 && (
          <div className="text-center py-8 text-slate-500">
            No user stories found matching your criteria.
          </div>
        )}
        
        <div className="mt-4 text-sm text-slate-600">
          Showing {filteredAndSortedStories.length} of {userStories.length} stories
        </div>
      </CardContent>
    </Card>
  );
}
