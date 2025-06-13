import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useScriptCreationStore } from '@/lib/stores/script-creation-store';

const YoutubeFilterBar = () => {
  const { searchParams, setSearchParams } = useScriptCreationStore();
  return (
    <div className="flex gap-2">
      <div className="w-full flex flex-col gap-2">
        <label htmlFor="">Limit</label>
        <Input
          placeholder="Limit"
          value={searchParams.maxResults}
          onChange={(e) =>
            setSearchParams({
              ...searchParams,
              maxResults: e.target.value,
            })
          }
        />
      </div>
      <div className="w-full flex items-end gap-2">
        <div className="flex-1 flex flex-col gap-2">
          <label htmlFor="published-after">Published After</label>
          <Input
            id="published-after"
            type="date"
            value={searchParams.publishedAfter}
            onChange={(e) =>
              setSearchParams({
                ...searchParams,
                publishedAfter: e.target.value,
              })
            }
          />
        </div>
        <div className="flex-1 flex flex-col gap-2">
          <label htmlFor="published-before">Published Before</label>
          <Input
            id="published-before"
            type="date"
            value={searchParams.publishedBefore}
            onChange={(e) =>
              setSearchParams({
                ...searchParams,
                publishedBefore: e.target.value,
              })
            }
          />
        </div>
      </div>
      <div className="w-full flex flex-col gap-2">
        <label htmlFor="">Language</label>
        <Input
          placeholder="Language"
          value={searchParams.relevanceLanguage}
          onChange={(e) =>
            setSearchParams({
              ...searchParams,
              relevanceLanguage: e.target.value,
            })
          }
        />
      </div>
      <div className="w-full flex flex-col gap-2">
        <label htmlFor="">Region Code</label>
        <Input
          placeholder="Region Code"
          value={searchParams.regionCode}
          onChange={(e) =>
            setSearchParams({
              ...searchParams,
              regionCode: e.target.value,
            })
          }
        />
      </div>
      <div className="w-full flex flex-col gap-2">
        <label htmlFor="">Sort By</label>
        <Select
          value={searchParams.order}
          onValueChange={(value) =>
            setSearchParams({ ...searchParams, order: value })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Sort By" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date">Date</SelectItem>
            <SelectItem value="relevance">Relevance</SelectItem>
            <SelectItem value="rating">Rating</SelectItem>
            <SelectItem value="viewCount">View Count</SelectItem>
            <SelectItem value="title">Title</SelectItem>
            <SelectItem value="videoCount">Video Count</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="w-full flex flex-col gap-2">
        <label htmlFor="">Duration</label>
        <Select
          value={searchParams.videoDuration}
          onValueChange={(value) =>
            setSearchParams({ ...searchParams, videoDuration: value })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Duration" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any</SelectItem>
            <SelectItem value="short">Short (Under 4 minutes)</SelectItem>
            <SelectItem value="medium">Medium (4 - 20 minutes)</SelectItem>
            <SelectItem value="long">Long (Over 20 minutes)</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default YoutubeFilterBar;
