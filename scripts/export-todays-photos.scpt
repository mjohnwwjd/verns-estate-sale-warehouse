on run argv
  set exportPath to item 1 of argv

  set startDate to current date
  set year of startDate to 2026
  set month of startDate to June
  set day of startDate to 3
  set time of startDate to 0

  set endDate to current date
  set year of endDate to 2026
  set month of endDate to June
  set day of endDate to 4
  set time of endDate to 0

  set exportFolder to POSIX file exportPath

  tell application "Photos"
    set todayItems to {}
    set libraryItems to media items
    repeat with oneItem in libraryItems
      try
        set itemDate to date of oneItem
        if itemDate is greater than or equal to startDate and itemDate is less than endDate then
          copy oneItem to end of todayItems
        end if
      end try
    end repeat
    set itemCount to count of todayItems
    if itemCount is greater than 0 then
      export todayItems to exportFolder with using originals
    end if
  end tell

  return itemCount as text
end run
